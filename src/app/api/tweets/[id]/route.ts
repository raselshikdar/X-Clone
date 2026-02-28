import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/tweets/[id] - Get single tweet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const currentUserId = session?.user?.id;

    const tweet = await db.tweet.findUnique({
      where: { id, deletedAt: null },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            bio: true,
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
        inReplyTo: {
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
          },
        },
        quotedTweet: {
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
          },
        },
        _count: {
          select: {
            likes: true,
            retweetRecords: true,
            replies: true,
          },
        },
      },
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Increment view count
    await db.tweet.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({
      tweet: {
        id: tweet.id,
        content: tweet.content,
        createdAt: tweet.createdAt,
        views: tweet.views + 1,
        sensitiveContent: tweet.sensitiveContent,
        isThread: tweet.isThread,
        threadOrder: tweet.threadOrder,
        author: {
          id: tweet.author.id,
          username: tweet.author.username,
          name: tweet.author.displayName || tweet.author.username,
          avatar: tweet.author.avatar,
          bio: tweet.author.bio,
          verified: !!tweet.author.verification,
          verifiedType: tweet.author.verification?.type,
        },
        media: tweet.media.map((m) => ({
          id: m.id,
          type: m.type,
          url: m.url,
          thumbnail: m.thumbnailUrl,
          width: m.width,
          height: m.height,
          altText: m.altText,
        })),
        _count: {
          likes: tweet._count.likes,
          retweets: tweet._count.retweetRecords,
          replies: tweet._count.replies,
        },
        isLiked: currentUserId
          ? (tweet.likes as { id: string }[])?.length > 0
          : false,
        isRetweeted: currentUserId
          ? (tweet.retweetRecords as { id: string }[])?.length > 0
          : false,
        isBookmarked: currentUserId
          ? (tweet.bookmarks as { id: string }[])?.length > 0
          : false,
        inReplyTo: tweet.inReplyTo
          ? {
              id: tweet.inReplyTo.id,
              content: tweet.inReplyTo.content,
              createdAt: tweet.inReplyTo.createdAt,
              author: {
                id: tweet.inReplyTo.author.id,
                username: tweet.inReplyTo.author.username,
                name:
                  tweet.inReplyTo.author.displayName ||
                  tweet.inReplyTo.author.username,
                avatar: tweet.inReplyTo.author.avatar,
                verified: !!tweet.inReplyTo.author.verification,
              },
              media: tweet.inReplyTo.media.map((m) => ({
                id: m.id,
                type: m.type,
                url: m.url,
                thumbnail: m.thumbnailUrl,
              })),
            }
          : null,
        quotedTweet: tweet.quotedTweet
          ? {
              id: tweet.quotedTweet.id,
              content: tweet.quotedTweet.content,
              createdAt: tweet.quotedTweet.createdAt,
              author: {
                id: tweet.quotedTweet.author.id,
                username: tweet.quotedTweet.author.username,
                name:
                  tweet.quotedTweet.author.displayName ||
                  tweet.quotedTweet.author.username,
                avatar: tweet.quotedTweet.author.avatar,
                verified: !!tweet.quotedTweet.author.verification,
              },
              media: tweet.quotedTweet.media.map((m) => ({
                id: m.id,
                type: m.type,
                url: m.url,
                thumbnail: m.thumbnailUrl,
              })),
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching tweet:", error);
    return NextResponse.json({ error: "Failed to fetch tweet" }, { status: 500 });
  }
}

// DELETE /api/tweets/[id] - Delete tweet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if tweet exists and belongs to user
    const tweet = await db.tweet.findUnique({
      where: { id, deletedAt: null },
      select: { authorId: true },
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only delete your own tweets" },
        { status: 403 }
      );
    }

    // Soft delete
    await db.tweet.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tweet:", error);
    return NextResponse.json({ error: "Failed to delete tweet" }, { status: 500 });
  }
}

// PUT /api/tweets/[id] - Update tweet (for pin/unpin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tweet = await db.tweet.findUnique({
      where: { id, deletedAt: null },
      select: { authorId: true },
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    if (tweet.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only modify your own tweets" },
        { status: 403 }
      );
    }

    // Handle different actions
    if (action === "incrementView") {
      await db.tweet.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating tweet:", error);
    return NextResponse.json({ error: "Failed to update tweet" }, { status: 500 });
  }
}
