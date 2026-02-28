import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/settings/verification - Get verification settings
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { verification: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      verificationStatus: user.verificationStatus,
      verified: user.verified,
      verifiedAt: user.verifiedAt,
      verification: user.verification
        ? {
            id: user.verification.id,
            type: user.verification.type,
            status: user.verification.status,
            verifiedAt: user.verification.verifiedAt,
            expiresAt: user.verification.expiresAt,
            businessName: user.verification.businessName,
            businessWebsite: user.verification.businessWebsite,
            officialEmail: user.verification.officialEmail,
            agencyName: user.verification.agencyName,
            rejectionReason: user.verification.rejectionReason,
            createdAt: user.verification.createdAt,
          }
        : null,
      // Settings for verification preferences
      showVerificationBadge: true, // Default to showing badge
      autoRenewBlue: true, // Default to auto-renew blue subscription
    });
  } catch (error) {
    console.error("Error fetching verification settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/verification - Update verification settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { verification: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { showVerificationBadge, autoRenewBlue, action } = body;

    // Handle cancellation of verification
    if (action === "cancel") {
      if (user.verification && user.verification.status === "pending") {
        await db.verification.delete({
          where: { id: user.verification.id },
        });
        await db.user.update({
          where: { id: user.id },
          data: {
            verificationStatus: "none",
          },
        });
        return NextResponse.json({
          success: true,
          message: "Verification request cancelled",
        });
      }
      return NextResponse.json(
        { error: "No pending verification to cancel" },
        { status: 400 }
      );
    }

    // Handle renewal of blue subscription
    if (action === "renew") {
      if (!user.verification || user.verification.type !== "blue") {
        return NextResponse.json(
          { error: "No blue verification to renew" },
          { status: 400 }
        );
      }
      const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.verification.update({
        where: { id: user.verification.id },
        data: { expiresAt: newExpiresAt },
      });
      return NextResponse.json({
        success: true,
        message: "Blue subscription renewed",
        expiresAt: newExpiresAt,
      });
    }

    // In a real app, you would store these preferences in a settings table
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      settings: {
        showVerificationBadge: showVerificationBadge ?? true,
        autoRenewBlue: autoRenewBlue ?? true,
      },
    });
  } catch (error) {
    console.error("Error updating verification settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
