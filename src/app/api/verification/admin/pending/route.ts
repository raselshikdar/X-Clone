import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { requireAdmin, logAudit } from "@/lib/admin";

// GET /api/verification/admin/pending - Get pending verification requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const actorId = (session?.user as { id?: string })?.id;

    if (!actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const user = await db.user.findUnique({ where: { id: actorId } });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const requests = await db.verification.findMany({
      where: {
        status: "pending",
        ...(type && { type }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatar: true,
            createdAt: true,
            _count: { select: { tweets: true, followers: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get pending verifications error:", error);
    return NextResponse.json({ error: "Failed to get requests" }, { status: 500 });
  }
}
