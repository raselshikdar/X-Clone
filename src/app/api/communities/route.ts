import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/communities - Get all public communities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const cursor = searchParams.get("cursor");

    const communities = await db.community.findMany({
      where: {
        isPrivate: false,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      include: {
        owner: {
          select: { id: true, username: true, displayName: true, avatar: true, verified: true },
        },
        _count: { select: { members: true, tweets: true } },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { memberCount: "desc" },
    });

    let nextCursor: string | null = null;
    if (communities.length > limit) {
      const nextItem = communities.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ communities, nextCursor });
  } catch (error) {
    console.error("Get communities error:", error);
    return NextResponse.json({ error: "Failed to get communities" }, { status: 500 });
  }
}

// POST /api/communities - Create new community
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, banner, icon, rules, isPrivate } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Community name is required" }, { status: 400 });
    }

    // Check if name already exists
    const existing = await db.community.findUnique({
      where: { name: name.toLowerCase().trim() },
    });

    if (existing) {
      return NextResponse.json({ error: "Community name already taken" }, { status: 400 });
    }

    // Create community and add owner as member
    const community = await db.community.create({
      data: {
        name: name.toLowerCase().trim(),
        description: description?.trim() || null,
        banner: banner || null,
        icon: icon || null,
        rules: rules ? JSON.stringify(rules) : null,
        isPrivate: isPrivate || false,
        ownerId: userId,
        memberCount: 1,
      },
    });

    // Add owner as member
    await db.communityMember.create({
      data: {
        communityId: community.id,
        userId,
        role: "owner",
      },
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    console.error("Create community error:", error);
    return NextResponse.json({ error: "Failed to create community" }, { status: 500 });
  }
}
