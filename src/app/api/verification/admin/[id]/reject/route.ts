import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/verification/admin/[id]/reject - Reject verification
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

    // Check admin role
    const adminUser = await db.user.findUnique({ where: { id: actorId } });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = body;

    const verification = await db.verification.findUnique({ where: { id } });
    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    // Update verification
    const updated = await db.verification.update({
      where: { id },
      data: {
        status: "rejected",
        rejectionReason: reason || null,
      },
    });

    // Update user
    await db.user.update({
      where: { id: verification.userId },
      data: { verificationStatus: "rejected" },
    });

    // Log audit
    await db.auditLog.create({
      data: {
        action: "verification.rejected",
        targetType: "verification",
        targetId: id,
        actorId,
        details: JSON.stringify({ reason }),
      },
    });

    return NextResponse.json({ verification: updated });
  } catch (error) {
    console.error("Reject verification error:", error);
    return NextResponse.json({ error: "Failed to reject" }, { status: 500 });
  }
}
