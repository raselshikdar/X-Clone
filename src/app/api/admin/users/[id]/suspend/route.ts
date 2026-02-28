import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/admin/users/[id]/suspend - Suspend user
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
    if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "moderator")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { reason, durationDays } = body;

    if (!reason?.trim()) {
      return NextResponse.json({ error: "Reason required" }, { status: 400 });
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cannot suspend admins
    if (targetUser.role === "admin") {
      return NextResponse.json({ error: "Cannot suspend admins" }, { status: 403 });
    }

    const endDate = new Date(Date.now() + (durationDays || 7) * 24 * 60 * 60 * 1000);

    const suspension = await db.suspension.create({
      data: {
        userId: id,
        reason,
        endDate,
        suspendedBy: actorId,
      },
    });

    // Log audit
    await db.auditLog.create({
      data: {
        action: "user.suspended",
        targetType: "user",
        targetId: id,
        actorId,
        details: JSON.stringify({ reason, durationDays, suspensionId: suspension.id }),
      },
    });

    return NextResponse.json({ suspension });
  } catch (error) {
    console.error("Suspend user error:", error);
    return NextResponse.json({ error: "Failed to suspend user" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]/suspend - Lift suspension
export async function DELETE(
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
    if (!adminUser || (adminUser.role !== "admin" && adminUser.role !== "moderator")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    await db.suspension.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false },
    });

    // Log audit
    await db.auditLog.create({
      data: {
        action: "user.unsuspended",
        targetType: "user",
        targetId: id,
        actorId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unsuspend user error:", error);
    return NextResponse.json({ error: "Failed to unsuspend user" }, { status: 500 });
  }
}
