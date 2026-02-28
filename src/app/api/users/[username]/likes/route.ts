import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/users/[username]/likes - Get tweets the user has liked
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Find the user
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current user if authenticated
    let currentUser = null;
    const session = await getServerSession();
    if (session?.user?.email) {
      currentUser = await db.user.findUnique({
        where: { email: session.user.email },
      });
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

    // Build where clause for likes
    const whereClause: any = {
      userId: user.id,
    };

    if (cursor) {
      whereClause.id = { lt: cursor };
    }

    // Fetch likes with tweet data
    const likes = await db.like.findMany({
      where: whereClause,
      take: limit + 1,
      orderBy: { createdAt: "desc" },
      include: {
        tweet: {
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
            _count: {
              select: {
                likes: true,
                replies: true,
                retweetRecords: true,
                bookmarks: true,
              },
            },
          },
        },
      },
    });

    // Filter out deleted tweets
    const validLikes = likes.filter((like) => like.tweet && !like.tweet.deletedAt);

    // Determine if there's a next page
    let nextCursor: string | null = null;
    if (validLikes.length > limit) {
      const nextItem = validLikes.pop();
      nextCursor = nextItem!.id;
    }

    // Format tweets
    const formattedTweets = validLikes.map((like) => ({
      id: like.tweet.id,
      content: like.tweet.content,
      createdAt: like.tweet.createdAt,
      views: like.tweet.views,
      likedAt: like.createdAt,
      user: {
        id: like.tweet.author.id,
        name: like.tweet.author.displayName || like.tweet.author.username,
        username: like.tweet.author.username,
        avatar: like.tweet.author.avatar,
        verified: like.tweet.author.verified,
      },
      media: like.tweet.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnail: m.thumbnailUrl,
      })),
      replies: like.tweet._count.replies,
      retweets: like.tweet._count.retweetRecords,
      likes: like.tweet._count.likes,
      bookmarks: like.tweet._count.bookmarks,
      isLiked: like.tweet.likes ? like.tweet.likes.length > 0 : false,
      isRetweeted: like.tweet.retweetRecords
        ? like.tweet.retweetRecords.length > 0
        : false,
      isBookmarked: like.tweet.bookmarks
        ? like.tweet.bookmarks.length > 0
        : false,
    }));

    return NextResponse.json({
      tweets: formattedTweets,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching user likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
