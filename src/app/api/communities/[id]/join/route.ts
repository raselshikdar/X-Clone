import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/communities/[id]/join - Join community
export async function POST(
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

    const community = await db.community.findUnique({ where: { id } });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check if already a member
    const existing = await db.communityMember.findFirst({
      where: { communityId: id, userId },
    });

    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }

    // Add member
    await db.communityMember.create({
      data: { communityId: id, userId, role: "member" },
    });

    // Update member count
    await db.community.update({
      where: { id },
      data: { memberCount: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Join community error:", error);
    return NextResponse.json({ error: "Failed to join community" }, { status: 500 });
  }
}

// DELETE /api/communities/[id]/join - Leave community
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

    const membership = await db.communityMember.findFirst({
      where: { communityId: id, userId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 400 });
    }

    // Owner cannot leave
    if (membership.role === "owner") {
      return NextResponse.json({ error: "Owner cannot leave. Transfer ownership first." }, { status: 400 });
    }

    // Remove member
    await db.communityMember.delete({ where: { id: membership.id } });

    // Update member count
    await db.community.update({
      where: { id },
      data: { memberCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leave community error:", error);
    return NextResponse.json({ error: "Failed to leave community" }, { status: 500 });
  }
}
