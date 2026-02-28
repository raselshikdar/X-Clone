import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/tweets/[id]/thread - Get full thread for a tweet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const currentUserId = session?.user?.id;

    // First, get the tweet to find if it's part of a thread
    const tweet = await db.tweet.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        authorId: true,
        isThread: true,
        threadOrder: true,
        inReplyToId: true,
      },
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Find all tweets in the thread
    // A thread is a series of replies from the same author
    let threadTweets: typeof tweets = [];

    const tweets = await db.tweet.findMany({
      where: {
        OR: [
          // All replies in the chain
          {
            OR: [
              { id },
              { inReplyToId: id },
            ],
          },
        ],
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verification: { select: { type: true } },
          },
        },
        media: { orderBy: { order: "asc" } },
        likes: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
        retweetRecords: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
        bookmarks: currentUserId
          ? { where: { userId: currentUserId }, select: { id: true } }
          : false,
        _count: {
          select: {
            likes: true,
            retweetRecords: true,
            replies: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Build the thread by following the reply chain
    const tweetMap = new Map(tweets.map((t) => [t.id, t]));
    const thread: typeof tweets = [];

    // Find the root tweet (not a reply)
    let current = tweetMap.get(id);
    if (!current) {
      return NextResponse.json({ thread: [], rootTweet: null });
    }

    // Go backwards to find the root
    while (current?.inReplyToId) {
      const parent = tweetMap.get(current.inReplyToId);
      if (!parent || parent.authorId !== current.authorId) break;
      current = parent;
    }

    // Now traverse forward from the root
    if (current) {
      thread.push(current);
      let replies = tweets.filter(
        (t) => t.inReplyToId === current?.id && t.authorId === current?.authorId
      );
      while (replies.length > 0) {
        const reply = replies[0]; // Take the first reply (should be only one for a thread)
        thread.push(reply);
        replies = tweets.filter(
          (t) => t.inReplyToId === reply.id && t.authorId === reply.authorId
        );
      }
    }

    // Transform tweets
    const transformedThread = thread.map((t) => ({
      id: t.id,
      content: t.content,
      createdAt: t.createdAt,
      views: t.views,
      author: {
        id: t.author.id,
        username: t.author.username,
        name: t.author.displayName || t.author.username,
        avatar: t.author.avatar,
        verified: !!t.author.verification,
      },
      media: t.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnail: m.thumbnailUrl,
      })),
      _count: {
        likes: t._count.likes,
        retweets: t._count.retweetRecords,
        replies: t._count.replies,
      },
      isLiked: currentUserId
        ? (t.likes as { id: string }[])?.length > 0
        : false,
      isRetweeted: currentUserId
        ? (t.retweetRecords as { id: string }[])?.length > 0
        : false,
      isBookmarked: currentUserId
        ? (t.bookmarks as { id: string }[])?.length > 0
        : false,
    }));

    return NextResponse.json({
      thread: transformedThread,
      rootTweetId: thread[0]?.id || null,
    });
  } catch (error) {
    console.error("Error fetching thread:", error);
    return NextResponse.json({ error: "Failed to fetch thread" }, { status: 500 });
  }
}

// POST /api/tweets/[id]/thread - Add to thread
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, media } = body;

    // Get the parent tweet
    const parentTweet = await db.tweet.findUnique({
      where: { id, deletedAt: null },
      include: {
        replies: {
          where: { authorId: session.user.id },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!parentTweet) {
      return NextResponse.json({ error: "Parent tweet not found" }, { status: 404 });
    }

    // Check if user owns the parent tweet (for threads)
    if (parentTweet.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only add to your own threads" },
        { status: 403 }
      );
    }

    // Determine thread order
    const threadOrder =
      parentTweet.replies.length > 0
        ? (parentTweet.replies[0].threadOrder || 1) + 1
        : 1;

    // Create the tweet as a reply
    const tweet = await db.tweet.create({
      data: {
        content: content || null,
        authorId: session.user.id,
        inReplyToId: id,
        isThread: true,
        threadOrder,
        hasMedia: media && media.length > 0,
        media:
          media && media.length > 0
            ? {
                create: media.map(
                  (m: { type: string; url: string; thumbnail?: string }, index: number) => ({
                    type: m.type,
                    url: m.url,
                    thumbnailUrl: m.thumbnail,
                    order: index,
                  })
                ),
              }
            : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verification: { select: { type: true } },
          },
        },
        media: { orderBy: { order: "asc" } },
        _count: {
          select: {
            likes: true,
            retweetRecords: true,
            replies: true,
          },
        },
      },
    });

    // Mark parent as thread
    await db.tweet.update({
      where: { id },
      data: { isThread: true },
    });

    return NextResponse.json({
      tweet: {
        id: tweet.id,
        content: tweet.content,
        createdAt: tweet.createdAt,
        views: tweet.views,
        author: {
          id: tweet.author.id,
          username: tweet.author.username,
          name: tweet.author.displayName || tweet.author.username,
          avatar: tweet.author.avatar,
          verified: !!tweet.author.verification,
        },
        media: tweet.media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          thumbnail: m.thumbnailUrl,
        })),
        _count: {
          likes: tweet._count.likes,
          retweets: tweet._count.retweetRecords,
          replies: tweet._count.replies,
        },
        isLiked: false,
        isRetweeted: false,
        isBookmarked: false,
      },
    });
  } catch (error) {
    console.error("Error adding to thread:", error);
    return NextResponse.json({ error: "Failed to add to thread" }, { status: 500 });
  }
}
