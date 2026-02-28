import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/users/[username]/followers - Get user's followers
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
      followingId: user.id,
      approved: true,
    };

    if (cursor) {
      whereClause.id = { lt: cursor };
    }

    // Fetch followers
    const followers = await db.follow.findMany({
      where: whereClause,
      take: limit + 1,
      orderBy: { createdAt: "desc" },
      include: {
        follower: {
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
    if (followers.length > limit) {
      const nextItem = followers.pop();
      nextCursor = nextItem!.id;
    }

    // Get follow status for each user
    const followerIds = followers.map((f) => f.follower.id);
    let followStatus: Record<string, boolean> = {};

    if (currentUser) {
      const existingFollows = await db.follow.findMany({
        where: {
          followerId: currentUser.id,
          followingId: { in: followerIds },
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
    const formattedUsers = followers.map((follow) => ({
      id: follow.follower.id,
      username: follow.follower.username,
      displayName: follow.follower.displayName,
      avatar: follow.follower.avatar,
      verified: follow.follower.verified,
      bio: follow.follower.bio,
      isPrivate: follow.follower.isPrivate,
      isFollowing: currentUser ? !!followStatus[follow.follower.id] : false,
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      users: formattedUsers,
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
