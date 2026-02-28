import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/lists - Get user's lists
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    let lists;

    if (username) {
      // Get public lists of another user
      const targetUser = await db.user.findUnique({
        where: { username },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      lists = await db.list.findMany({
        where: {
          ownerId: targetUser.id,
          isPrivate: false,
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
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Get current user's lists (including private)
      lists = await db.list.findMany({
        where: {
          ownerId: currentUser.id,
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
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      lists: lists.map((list) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        isPrivate: list.isPrivate,
        createdAt: list.createdAt,
        memberCount: list._count.members,
        owner: list.owner,
        isOwner: list.ownerId === currentUser.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching lists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/lists - Create new list
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
    const { name, description, isPrivate } = body;

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

    if (description && description.length > 200) {
      return NextResponse.json(
        { error: "Description must be 200 characters or less" },
        { status: 400 }
      );
    }

    // Check if user already has a list with this name
    const existingList = await db.list.findFirst({
      where: {
        ownerId: currentUser.id,
        name: name.trim(),
      },
    });

    if (existingList) {
      return NextResponse.json(
        { error: "You already have a list with this name" },
        { status: 400 }
      );
    }

    const list = await db.list.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPrivate: isPrivate || false,
        ownerId: currentUser.id,
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
        id: list.id,
        name: list.name,
        description: list.description,
        isPrivate: list.isPrivate,
        createdAt: list.createdAt,
        memberCount: list._count.members,
        owner: list.owner,
        isOwner: true,
      },
    });
  } catch (error) {
    console.error("Error creating list:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
