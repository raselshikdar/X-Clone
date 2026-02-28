import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/communities/[id] - Get community details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    const community = await db.community.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, username: true, displayName: true, avatar: true, verified: true },
        },
        members: {
          select: { userId: true, role: true },
        },
        _count: { select: { members: true, tweets: true } },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check if user is a member
    const membership = community.members.find((m) => m.userId === userId);

    // For private communities, only members can view
    if (community.isPrivate && !membership) {
      return NextResponse.json({ error: "Private community" }, { status: 403 });
    }

    return NextResponse.json({
      community: {
        ...community,
        rules: community.rules ? JSON.parse(community.rules) : [],
        isMember: !!membership,
        userRole: membership?.role || null,
      },
    });
  } catch (error) {
    console.error("Get community error:", error);
    return NextResponse.json({ error: "Failed to get community" }, { status: 500 });
  }
}

// PUT /api/communities/[id] - Update community
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin or owner
    const membership = await db.communityMember.findFirst({
      where: { communityId: id, userId, role: { in: ["owner", "admin"] } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, banner, icon, rules, isPrivate } = body;

    const community = await db.community.update({
      where: { id },
      data: {
        name: name?.toLowerCase().trim(),
        description: description?.trim() || null,
        banner: banner || null,
        icon: icon || null,
        rules: rules ? JSON.stringify(rules) : null,
        isPrivate,
      },
    });

    return NextResponse.json({ community });
  } catch (error) {
    console.error("Update community error:", error);
    return NextResponse.json({ error: "Failed to update community" }, { status: 500 });
  }
}

// DELETE /api/communities/[id] - Delete community
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is owner
    const membership = await db.communityMember.findFirst({
      where: { communityId: id, userId, role: "owner" },
    });

    if (!membership) {
      return NextResponse.json({ error: "Only owner can delete community" }, { status: 403 });
    }

    await db.community.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete community error:", error);
    return NextResponse.json({ error: "Failed to delete community" }, { status: 500 });
  }
}
