import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/verification/admin/[id]/approve - Approve verification
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

    const verification = await db.verification.findUnique({ where: { id } });
    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    // Update verification
    const updated = await db.verification.update({
      where: { id },
      data: {
        status: "approved",
        verifiedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
    });

    // Update user
    await db.user.update({
      where: { id: verification.userId },
      data: {
        verified: true,
        verifiedAt: new Date(),
        verificationStatus: "approved",
      },
    });

    // Log audit
    await db.auditLog.create({
      data: {
        action: "verification.approved",
        targetType: "verification",
        targetId: id,
        actorId,
        details: JSON.stringify({ type: verification.type }),
      },
    });

    return NextResponse.json({ verification: updated });
  } catch (error) {
    console.error("Approve verification error:", error);
    return NextResponse.json({ error: "Failed to approve" }, { status: 500 });
  }
}
