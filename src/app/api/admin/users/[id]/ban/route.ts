import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/admin/users/[id]/ban - Permanently ban user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    const actorId = (session?.user as { id?: string })?.id;

    if (!actorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await db.user.findUnique({ where: { id: actorId } });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot ban admins
    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "Cannot ban admins" }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = body;

    // Delete user (cascade will handle related data)
    await db.user.delete({ where: { id } });

    // Log audit
    await db.auditLog.create({
      data: {
        action: "user.banned",
        targetType: "user",
        targetId: id,
        actorId,
        details: JSON.stringify({ reason, username: targetUser.username, email: targetUser.email }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ban user error:", error);
    return NextResponse.json({ error: "Failed to ban user" }, { status: 500 });
  }
}
