import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/communities/[id]/members - Get community members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const cursor = searchParams.get("cursor");

    const members = await db.communityMember.findMany({
      where: { communityId: id },
      include: {
        user: {
          select: { id: true, username: true, displayName: true, avatar: true, verified: true },
        },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });

    let nextCursor: string | null = null;
    if (members.length > limit) {
      const nextItem = members.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ members, nextCursor });
  } catch (error) {
    console.error("Get community members error:", error);
    return NextResponse.json({ error: "Failed to get members" }, { status: 500 });
  }
}
