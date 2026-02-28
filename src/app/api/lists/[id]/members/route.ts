import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/lists/[id]/members - Get list members
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

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

    const members = await db.listMember.findMany({
      where: { listId: id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
            bio: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    const hasMore = members.length > limit;
    const items = hasMore ? members.slice(0, -1) : members;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      members: items.map((m) => ({
        id: m.user.id,
        username: m.user.username,
        displayName: m.user.displayName,
        avatar: m.user.avatar,
        verified: m.user.verified,
        bio: m.user.bio,
        addedAt: m.addedAt,
      })),
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching list members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/lists/[id]/members - Add member to list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const list = await db.list.findUnique({
      where: { id },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (list.ownerId !== currentUser.id) {
      return NextResponse.json(
        { error: "You don't have permission to add members to this list" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToAdd = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        verified: true,
        bio: true,
      },
    });

    if (!userToAdd) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already a member
    const existingMember = await db.listMember.findUnique({
      where: {
        listId_userId: {
          listId: id,
          userId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this list" },
        { status: 400 }
      );
    }

    // Add member
    await db.listMember.create({
      data: {
        listId: id,
        userId,
      },
    });

    return NextResponse.json({
      member: {
        id: userToAdd.id,
        username: userToAdd.username,
        displayName: userToAdd.displayName,
        avatar: userToAdd.avatar,
        verified: userToAdd.verified,
        bio: userToAdd.bio,
        addedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error adding member to list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/lists/[id]/members - Remove member from list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const list = await db.list.findUnique({
      where: { id },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    if (list.ownerId !== currentUser.id) {
      return NextResponse.json(
        { error: "You don't have permission to remove members from this list" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Remove member
    const result = await db.listMember.deleteMany({
      where: {
        listId: id,
        userId,
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: "User is not a member of this list" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member from list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
