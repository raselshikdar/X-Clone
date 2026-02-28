import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/suggestions - Get "Who to follow" suggestions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        following: {
          select: { followingId: true },
        },
        blocked: {
          select: { blockedId: true },
        },
        blockedBy: {
          select: { blockerId: true },
        },
        muted: {
          select: { mutedId: true },
        },
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");
    const exclude = searchParams.get("exclude")?.split(",") || [];

    // Users to exclude: self, already following, blocked, muted
    const excludeIds = new Set([
      currentUser.id,
      ...currentUser.following.map((f) => f.followingId),
      ...currentUser.blocked.map((b) => b.blockedId),
      ...currentUser.blockedBy.map((b) => b.blockerId),
      ...currentUser.muted.map((m) => m.mutedId),
      ...exclude,
    ]);

    // Strategy 1: Get users that the people you follow also follow
    const followingIds = currentUser.following.map((f) => f.followingId);

    let suggestedUsers: any[] = [];

    if (followingIds.length > 0) {
      // Find users followed by multiple people you follow
      const mutualFollows = await db.follow.groupBy({
        by: ["followingId"],
        where: {
          followerId: { in: followingIds },
          followingId: { notIn: Array.from(excludeIds) },
        },
        _count: {
          followingId: true,
        },
        orderBy: {
          _count: {
            followingId: "desc",
          },
        },
        take: limit,
      });

      if (mutualFollows.length > 0) {
        const users = await db.user.findMany({
          where: {
            id: { in: mutualFollows.map((m) => m.followingId) },
          },
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
            bio: true,
            _count: {
              select: { followers: true },
            },
          },
        });

        // Sort by mutual follow count
        suggestedUsers = mutualFollows
          .map((m) => {
            const user = users.find((u) => u.id === m.followingId);
            if (!user) return null;
            return {
              ...user,
              mutualCount: m._count.followingId,
              reason: `Followed by ${m._count.followingId} people you follow`,
            };
          })
          .filter(Boolean) as any[];
      }
    }

    // Strategy 2: If not enough suggestions, add popular users
    if (suggestedUsers.length < limit) {
      const excludeIdsSet = new Set([
        ...excludeIds,
        ...suggestedUsers.map((u) => u.id),
      ]);

      const popularUsers = await db.user.findMany({
        where: {
          id: { notIn: Array.from(excludeIdsSet) },
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          verified: true,
          bio: true,
          _count: {
            select: { followers: true },
          },
        },
        orderBy: {
          createdAt: "asc", // Older accounts first (more established)
        },
        take: limit - suggestedUsers.length,
      });

      suggestedUsers = [
        ...suggestedUsers,
        ...popularUsers.map((u) => ({
          ...u,
          reason: "Popular on X",
        })),
      ];
    }

    // Strategy 3: If still not enough, get random users
    if (suggestedUsers.length < limit) {
      const excludeIdsSet = new Set([
        ...excludeIds,
        ...suggestedUsers.map((u) => u.id),
      ]);

      const randomUsers = await db.user.findMany({
        where: {
          id: { notIn: Array.from(excludeIdsSet) },
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          verified: true,
          bio: true,
          _count: {
            select: { followers: true },
          },
        },
        take: limit - suggestedUsers.length,
      });

      suggestedUsers = [
        ...suggestedUsers,
        ...randomUsers.map((u) => ({
          ...u,
          reason: "Suggested for you",
        })),
      ];
    }

    return NextResponse.json({
      suggestions: suggestedUsers.slice(0, limit).map((user) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        verified: user.verified,
        bio: user.bio,
        followersCount: user._count.followers,
        reason: user.reason,
      })),
    });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/suggestions/dismiss - Dismiss a suggestion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // For now, we just return success
    // In a full implementation, this would store dismissed suggestions
    // to avoid showing them again in the future
    // We could use a DismissedSuggestion model for this

    return NextResponse.json({
      success: true,
      action: action || "dismissed",
    });
  } catch (error) {
    console.error("Error dismissing suggestion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
