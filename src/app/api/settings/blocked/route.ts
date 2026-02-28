import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/settings/blocked - Get blocked accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get blocked users
    const blockedUsers = await db.block.findMany({
      where: {
        blockerId: user.id,
        blocked: {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            bio: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const total = await db.block.count({
      where: {
        blockerId: user.id,
        blocked: {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    });

    return NextResponse.json({
      users: blockedUsers.map((block) => ({
        id: block.blocked.id,
        username: block.blocked.username,
        displayName: block.blocked.displayName,
        avatar: block.blocked.avatar,
        bio: block.blocked.bio,
        verified: block.blocked.verified,
        blockedAt: block.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching blocked accounts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/settings/blocked - Block a user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Can't block yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot block yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToBlock = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userToBlock) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already blocked
    const existingBlock = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: userId,
        },
      },
    });

    if (existingBlock) {
      return NextResponse.json(
        { error: "User already blocked" },
        { status: 400 }
      );
    }

    // Create block and remove any follow relationships
    await db.$transaction([
      // Create block
      db.block.create({
        data: {
          blockerId: user.id,
          blockedId: userId,
        },
      }),
      // Remove follow relationships
      db.follow.deleteMany({
        where: {
          OR: [
            { followerId: user.id, followingId: userId },
            { followerId: userId, followingId: user.id },
          ],
        },
      }),
    ]);

    return NextResponse.json({ success: true, blocked: true });
  } catch (error) {
    console.error("Error blocking user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/blocked - Unblock a user
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete block
    await db.block.delete({
      where: {
        blockerId_blockedId: {
          blockerId: user.id,
          blockedId: userId,
        },
      },
    });

    return NextResponse.json({ success: true, unblocked: true });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
