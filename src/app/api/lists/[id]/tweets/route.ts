import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/lists/[id]/tweets - Get tweets from list members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();

    const list = await db.list.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Check access for private lists
    if (list.isPrivate) {
      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const currentUser = await db.user.findUnique({
        where: { email: session.user.email },
      });

      if (!currentUser || currentUser.id !== list.ownerId) {
        return NextResponse.json({ error: "List not found" }, { status: 404 });
      }
    }

    // Get member IDs
    const members = await db.listMember.findMany({
      where: { listId: id },
      select: { userId: true },
    });

    const memberIds = members.map((m) => m.userId);

    if (memberIds.length === 0) {
      return NextResponse.json({
        tweets: [],
        nextCursor: null,
      });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get current user for like/bookmark status
    let currentUserId: string | null = null;
    if (session?.user?.email) {
      const currentUser = await db.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      currentUserId = currentUser?.id || null;
    }

    // Fetch tweets from list members
    const tweets = await db.tweet.findMany({
      where: {
        authorId: { in: memberIds },
        deletedAt: null,
        inReplyToId: null, // Only original tweets, not replies
        retweetOfId: null, // Only original tweets, not retweets
      },
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
        media: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: {
            likes: true,
            retweetRecords: true,
            replies: true,
          },
        },
        likes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
        bookmarks: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
        retweetRecords: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true },
            }
          : false,
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    const hasMore = tweets.length > limit;
    const items = hasMore ? tweets.slice(0, -1) : tweets;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      tweets: items.map((tweet) => ({
        id: tweet.id,
        content: tweet.content,
        createdAt: tweet.createdAt,
        views: tweet.views,
        hasMedia: tweet.hasMedia,
        sensitiveContent: tweet.sensitiveContent,
        author: tweet.author,
        media: tweet.media,
        _count: tweet._count,
        isLiked: currentUserId ? (tweet.likes as any[])?.length > 0 : false,
        isBookmarked: currentUserId
          ? (tweet.bookmarks as any[])?.length > 0
          : false,
        isRetweeted: currentUserId
          ? (tweet.retweetRecords as any[])?.length > 0
          : false,
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching list tweets:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
