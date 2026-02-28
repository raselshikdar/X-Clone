import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/admin/audit-logs - Get audit logs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const targetType = searchParams.get("targetType");
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const cursor = searchParams.get("cursor");

    const logs = await db.auditLog.findMany({
      where: {
        ...(action && { action: { contains: action } }),
        ...(targetType && { targetType }),
      },
      include: {
        actor: {
          select: { id: true, username: true, displayName: true, avatar: true },
        },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (logs.length > limit) {
      const nextItem = logs.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ logs, nextCursor });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return NextResponse.json({ error: "Failed to get logs" }, { status: 500 });
  }
}
