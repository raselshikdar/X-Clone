import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/admin/reports/[id]/action - Take action on report
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
    const { action, durationDays, reason } = body;

    if (!["warning", "suspension", "ban", "dismiss"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const report = await db.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update report
    const updated = await db.report.update({
      where: { id },
      data: {
        status: action === "dismiss" ? "dismissed" : "resolved",
        reviewedBy: actorId,
        reviewedAt: new Date(),
        action,
      },
    });

    // Take action based on type
    if (action !== "dismiss" && report.reportedId) {
      if (action === "suspension") {
        const endDate = new Date(Date.now() + (durationDays || 7) * 24 * 60 * 60 * 1000);
        await db.suspension.create({
          data: {
            userId: report.reportedId,
            reason: reason || report.reason,
            endDate,
            suspendedBy: actorId,
          },
        });
      } else if (action === "ban") {
        const targetUser = await db.user.findUnique({ where: { id: report.reportedId } });
        if (targetUser && targetUser.role !== "admin") {
          await db.user.delete({ where: { id: report.reportedId } });
        }
      }
    }

    // Log audit
    await db.auditLog.create({
      data: {
        action: `report.${action}`,
        targetType: "report",
        targetId: id,
        actorId,
        details: JSON.stringify({ reportType: report.type, reportedId: report.reportedId }),
      },
    });

    return NextResponse.json({ report: updated });
  } catch (error) {
    console.error("Report action error:", error);
    return NextResponse.json({ error: "Failed to process action" }, { status: 500 });
  }
}
