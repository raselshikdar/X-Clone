import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/lists/[id] - Get list details with members
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
        _count: {
          select: { members: true },
        },
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
        members: {
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
          take: 100, // Limit members returned in details
        },
      },
    });

    if (!list) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    // Check access for private lists
    let isOwner = false;
    if (session?.user?.email) {
      const currentUser = await db.user.findUnique({
        where: { email: session.user.email },
      });
      isOwner = currentUser?.id === list.ownerId;
    }

    if (list.isPrivate && !isOwner) {
      return NextResponse.json({ error: "List not found" }, { status: 404 });
    }

    return NextResponse.json({
      list: {
        id: list.id,
        name: list.name,
        description: list.description,
        isPrivate: list.isPrivate,
        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
        memberCount: list._count.members,
        owner: list.owner,
        isOwner,
        members: list.members.map((m) => ({
          id: m.user.id,
          username: m.user.username,
          displayName: m.user.displayName,
          avatar: m.user.avatar,
          verified: m.user.verified,
          bio: m.user.bio,
          addedAt: m.addedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/lists/[id] - Update list
export async function PUT(
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
        { error: "You don't have permission to edit this list" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, isPrivate } = body;

    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return NextResponse.json(
          { error: "List name is required" },
          { status: 400 }
        );
      }

      if (name.length > 50) {
        return NextResponse.json(
          { error: "List name must be 50 characters or less" },
          { status: 400 }
        );
      }

      // Check for duplicate name
      const existingList = await db.list.findFirst({
        where: {
          ownerId: currentUser.id,
          name: name.trim(),
          NOT: { id },
        },
      });

      if (existingList) {
        return NextResponse.json(
          { error: "You already have a list with this name" },
          { status: 400 }
        );
      }
    }

    if (description !== undefined && description && description.length > 200) {
      return NextResponse.json(
        { error: "Description must be 200 characters or less" },
        { status: 400 }
      );
    }

    const updatedList = await db.list.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description:
          description !== undefined ? description?.trim() || null : undefined,
        isPrivate: isPrivate !== undefined ? isPrivate : undefined,
      },
      include: {
        _count: {
          select: { members: true },
        },
        owner: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
      },
    });

    return NextResponse.json({
      list: {
        id: updatedList.id,
        name: updatedList.name,
        description: updatedList.description,
        isPrivate: updatedList.isPrivate,
        createdAt: updatedList.createdAt,
        memberCount: updatedList._count.members,
        owner: updatedList.owner,
        isOwner: true,
      },
    });
  } catch (error) {
    console.error("Error updating list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/lists/[id] - Delete list
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
        { error: "You don't have permission to delete this list" },
        { status: 403 }
      );
    }

    await db.list.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
