import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/verification/apply - Apply for verification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, businessName, businessWebsite, businessCategory, documentsUrl, officialEmail, agencyName } = body;

    if (!["blue", "gold", "gray", "government"].includes(type)) {
      return NextResponse.json({ error: "Invalid verification type" }, { status: 400 });
    }

    // Check for existing verification
    const existing = await db.verification.findUnique({ where: { userId } });
    if (existing && existing.status === "approved") {
      return NextResponse.json({ error: "Already verified" }, { status: 400 });
    }

    // For blue checkmark, auto-approve (simulating payment)
    const isBlueAutoApprove = type === "blue";

    if (existing) {
      // Update existing
      const verification = await db.verification.update({
        where: { userId },
        data: {
          type,
          status: isBlueAutoApprove ? "approved" : "pending",
          verifiedAt: isBlueAutoApprove ? new Date() : null,
          expiresAt: isBlueAutoApprove ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null, // 1 year
          businessName: businessName || null,
          businessWebsite: businessWebsite || null,
          businessCategory: businessCategory || null,
          documentsUrl: documentsUrl || null,
          officialEmail: officialEmail || null,
          agencyName: agencyName || null,
        },
      });

      if (isBlueAutoApprove) {
        await db.user.update({
          where: { id: userId },
          data: { verified: true, verifiedAt: new Date(), verificationStatus: "approved" },
        });
      }

      return NextResponse.json({ verification });
    }

    // Create new
    const verification = await db.verification.create({
      data: {
        userId,
        type,
        status: isBlueAutoApprove ? "approved" : "pending",
        verifiedAt: isBlueAutoApprove ? new Date() : null,
        expiresAt: isBlueAutoApprove ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
        businessName: businessName || null,
        businessWebsite: businessWebsite || null,
        businessCategory: businessCategory || null,
        documentsUrl: documentsUrl || null,
        officialEmail: officialEmail || null,
        agencyName: agencyName || null,
      },
    });

    if (isBlueAutoApprove) {
      await db.user.update({
        where: { id: userId },
        data: { verified: true, verifiedAt: new Date(), verificationStatus: "approved" },
      });
    }

    return NextResponse.json({ verification }, { status: 201 });
  } catch (error) {
    console.error("Apply verification error:", error);
    return NextResponse.json({ error: "Failed to apply" }, { status: 500 });
  }
}
