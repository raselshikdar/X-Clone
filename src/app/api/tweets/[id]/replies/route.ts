import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/tweets/[id]/replies - Get replies for a tweet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

    const currentUserId = session?.user?.id;

    const replies = await db.tweet.findMany({
      where: {
        inReplyToId: id,
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
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    let nextCursor: string | undefined;
    if (replies.length > limit) {
      const nextItem = replies.pop();
      nextCursor = nextItem?.id;
    }

    const transformedReplies = replies.map((reply) => ({
      id: reply.id,
      content: reply.content,
      createdAt: reply.createdAt,
      views: reply.views,
      author: {
        id: reply.author.id,
        username: reply.author.username,
        name: reply.author.displayName || reply.author.username,
        avatar: reply.author.avatar,
        verified: !!reply.author.verification,
      },
      media: reply.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnail: m.thumbnailUrl,
      })),
      _count: {
        likes: reply._count.likes,
        retweets: reply._count.retweetRecords,
        replies: reply._count.replies,
      },
      isLiked: currentUserId
        ? (reply.likes as { id: string }[])?.length > 0
        : false,
      isRetweeted: currentUserId
        ? (reply.retweetRecords as { id: string }[])?.length > 0
        : false,
      isBookmarked: currentUserId
        ? (reply.bookmarks as { id: string }[])?.length > 0
        : false,
    }));

    return NextResponse.json({
      replies: transformedReplies,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching replies:", error);
    return NextResponse.json({ error: "Failed to fetch replies" }, { status: 500 });
  }
}
