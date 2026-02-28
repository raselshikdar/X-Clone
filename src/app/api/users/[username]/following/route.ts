import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/users/[username]/following - Get users that the user follows
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

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
      return NextResponse.json({ users: [], nextCursor: null });
    }

    // Build where clause
    const whereClause: any = {
      followerId: user.id,
      approved: true,
    };

    if (cursor) {
      whereClause.id = { lt: cursor };
    }

    // Fetch following
    const following = await db.follow.findMany({
      where: whereClause,
      take: limit + 1,
      orderBy: { createdAt: "desc" },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
            bio: true,
            isPrivate: true,
          },
        },
      },
    });

    // Determine if there's a next page
    let nextCursor: string | null = null;
    if (following.length > limit) {
      const nextItem = following.pop();
      nextCursor = nextItem!.id;
    }

    // Get follow status for each user
    const followingIds = following.map((f) => f.following.id);
    let followStatus: Record<string, boolean> = {};

    if (currentUser) {
      const existingFollows = await db.follow.findMany({
        where: {
          followerId: currentUser.id,
          followingId: { in: followingIds },
        },
        select: {
          followingId: true,
        },
      });
      followStatus = existingFollows.reduce((acc, f) => {
        acc[f.followingId] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }

    // Format users
    const formattedUsers = following.map((follow) => ({
      id: follow.following.id,
      username: follow.following.username,
      displayName: follow.following.displayName,
      avatar: follow.following.avatar,
      verified: follow.following.verified,
      bio: follow.following.bio,
      isPrivate: follow.following.isPrivate,
      isFollowing: currentUser ? !!followStatus[follow.following.id] : false,
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      users: formattedUsers,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
