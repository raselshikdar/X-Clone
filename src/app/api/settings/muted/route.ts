import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/settings/muted - Get muted accounts
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

    // Get muted users
    const mutedUsers = await db.mute.findMany({
      where: {
        muterId: user.id,
        muted: {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      include: {
        muted: {
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
    const total = await db.mute.count({
      where: {
        muterId: user.id,
        muted: {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    });

    return NextResponse.json({
      users: mutedUsers.map((mute) => ({
        id: mute.muted.id,
        username: mute.muted.username,
        displayName: mute.muted.displayName,
        avatar: mute.muted.avatar,
        bio: mute.muted.bio,
        verified: mute.muted.verified,
        mutedAt: mute.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching muted accounts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/settings/muted - Mute a user
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

    // Can't mute yourself
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Cannot mute yourself" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToMute = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userToMute) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already muted
    const existingMute = await db.mute.findUnique({
      where: {
        muterId_mutedId: {
          muterId: user.id,
          mutedId: userId,
        },
      },
    });

    if (existingMute) {
      return NextResponse.json(
        { error: "User already muted" },
        { status: 400 }
      );
    }

    // Create mute
    await db.mute.create({
      data: {
        muterId: user.id,
        mutedId: userId,
      },
    });

    return NextResponse.json({ success: true, muted: true });
  } catch (error) {
    console.error("Error muting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/muted - Unmute a user
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

    // Delete mute
    await db.mute.delete({
      where: {
        muterId_mutedId: {
          muterId: user.id,
          mutedId: userId,
        },
      },
    });

    return NextResponse.json({ success: true, unmuted: true });
  } catch (error) {
    console.error("Error unmuting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
