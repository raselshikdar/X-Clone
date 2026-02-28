import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id || null;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!q.trim()) {
      return NextResponse.json({
        users: [],
        nextCursor: null,
      });
    }

    const users = await db.user.findMany({
      where: {
        OR: [
          { username: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        verified: true,
        bio: true,
        _count: {
          select: {
            followers: true,
          },
        },
      },
      orderBy: [
        { verified: "desc" },
        { _count: { followers: "desc" } },
      ],
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    let nextCursor: string | null = null;
    if (users.length > limit) {
      const nextItem = users.pop();
      nextCursor = nextItem!.id;
    }

    // Check follow status for authenticated users
    let usersWithFollowStatus = users.map((user) => ({
      id: user.id,
      username: user.username,
      name: user.displayName || user.username,
      avatar: user.avatar,
      verified: user.verified,
      bio: user.bio,
      followersCount: user._count.followers,
      isFollowing: false,
    }));

    if (userId) {
      const follows = await db.follow.findMany({
        where: {
          followerId: userId,
          followingId: { in: users.map((u) => u.id) },
        },
        select: { followingId: true },
      });
      const followingIds = new Set(follows.map((f) => f.followingId));

      usersWithFollowStatus = usersWithFollowStatus.map((user) => ({
        ...user,
        isFollowing: followingIds.has(user.id),
      }));
    }

    return NextResponse.json({
      users: usersWithFollowStatus,
      nextCursor,
    });
  } catch (error) {
    console.error("Search users error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
