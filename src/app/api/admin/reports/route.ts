import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/admin/reports - Get reports with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const cursor = searchParams.get("cursor");

    const reports = await db.report.findMany({
      where: {
        status,
        ...(type && { type }),
      },
      include: {
        reporter: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
        reportedUser: {
          select: { id: true, username: true, displayName: true, avatar: true, verified: true },
        },
        reviewer: {
          select: { id: true, username: true, displayName: true },
        },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (reports.length > limit) {
      const nextItem = reports.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ reports, nextCursor });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json({ error: "Failed to get reports" }, { status: 500 });
  }
}
