import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/users/[username]/tweets - Get user's tweets with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10");
    const tab = searchParams.get("tab") || "tweets"; // tweets, replies, media

    // Find the user
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current user if authenticated
    let currentUser = null;
    if (request.headers.get("authorization")) {
      const session = await getServerSession();
      if (session?.user?.email) {
        currentUser = await db.user.findUnique({
          where: { email: session.user.email },
        });
      }
    }

    // Check if current user is following this user
    let isFollowing = false;
    let isBlocked = false;

    if (currentUser) {
      const followRecord = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!followRecord;

      // Check if blocked
      const blockedRecord = await db.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: user.id,
            blockedId: currentUser.id,
          },
        },
      });
      isBlocked = !!blockedRecord;
    }

    // If blocked or private profile and not following, return empty
    const isOwnProfile = currentUser?.id === user.id;
    if (isBlocked || (user.isPrivate && !isFollowing && !isOwnProfile)) {
      return NextResponse.json({ tweets: [], nextCursor: null });
    }

    // Build where clause based on tab
    const whereClause: any = {
      authorId: user.id,
      deletedAt: null,
    };

    if (tab === "tweets") {
      // Only original tweets (not replies)
      whereClause.inReplyToId = null;
      whereClause.retweetOfId = null;
    } else if (tab === "replies") {
      // Only replies
      whereClause.inReplyToId = { not: null };
    } else if (tab === "media") {
      // Tweets with media
      whereClause.inReplyToId = null;
      whereClause.hasMedia = true;
    }

    // Add cursor condition
    if (cursor) {
      whereClause.id = { lt: cursor };
    }

    // Fetch tweets
    const tweets = await db.tweet.findMany({
      where: whereClause,
      take: limit + 1,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
        media: true,
        likes: currentUser
          ? {
              where: { userId: currentUser.id },
              select: { id: true },
            }
          : false,
        retweetRecords: currentUser
          ? {
              where: { userId: currentUser.id },
              select: { id: true },
            }
          : false,
        bookmarks: currentUser
          ? {
              where: { userId: currentUser.id },
              select: { id: true },
            }
          : false,
        inReplyTo: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                verified: true,
              },
            },
          },
        },
        retweetOriginal: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                verified: true,
              },
            },
            media: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
            retweetRecords: true,
            bookmarks: true,
          },
        },
      },
    });

    // Determine if there's a next page
    let nextCursor: string | null = null;
    if (tweets.length > limit) {
      const nextItem = tweets.pop();
      nextCursor = nextItem!.id;
    }

    // Format tweets
    const formattedTweets = tweets.map((tweet) => ({
      id: tweet.id,
      content: tweet.content,
      createdAt: tweet.createdAt,
      views: tweet.views,
      isReply: !!tweet.inReplyToId,
      isRetweet: !!tweet.retweetOfId,
      replyTo: tweet.inReplyTo
        ? {
            id: tweet.inReplyTo.id,
            author: {
              username: tweet.inReplyTo.author.username,
            },
          }
        : null,
      retweetOf: tweet.retweetOriginal
        ? {
            id: tweet.retweetOriginal.id,
            content: tweet.retweetOriginal.content,
            createdAt: tweet.retweetOriginal.createdAt,
            author: tweet.retweetOriginal.author,
            media: tweet.retweetOriginal.media,
          }
        : null,
      user: {
        id: tweet.author.id,
        name: tweet.author.displayName || tweet.author.username,
        username: tweet.author.username,
        avatar: tweet.author.avatar,
        verified: tweet.author.verified,
      },
      media: tweet.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnail: m.thumbnailUrl,
      })),
      replies: tweet._count.replies,
      retweets: tweet._count.retweetRecords,
      likes: tweet._count.likes,
      bookmarks: tweet._count.bookmarks,
      isLiked: tweet.likes ? tweet.likes.length > 0 : false,
      isRetweeted: tweet.retweetRecords ? tweet.retweetRecords.length > 0 : false,
      isBookmarked: tweet.bookmarks ? tweet.bookmarks.length > 0 : false,
    }));

    return NextResponse.json({
      tweets: formattedTweets,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching user tweets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
