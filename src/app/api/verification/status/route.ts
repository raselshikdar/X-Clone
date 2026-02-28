import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/verification/status - Get user's verification status
export async function GET() {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const verification = await db.verification.findUnique({
      where: { userId },
    });

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { verified: true, verifiedAt: true, verificationStatus: true },
    });

    return NextResponse.json({
      verification,
      userStatus: user,
    });
  } catch (error) {
    console.error("Get verification status error:", error);
    return NextResponse.json({ error: "Failed to get status" }, { status: 500 });
  }
}
