import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/communities/my - Get user's joined communities
export async function GET() {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await db.communityMember.findMany({
      where: { userId },
      include: {
        community: {
          include: {
            owner: {
              select: { id: true, username: true, displayName: true, avatar: true },
            },
            _count: { select: { members: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    });

    const communities = memberships.map((m) => ({
      ...m.community,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json({ communities });
  } catch (error) {
    console.error("Get my communities error:", error);
    return NextResponse.json({ error: "Failed to get communities" }, { status: 500 });
  }
}
