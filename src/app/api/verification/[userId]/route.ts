import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/verification/[userId] - Get verification details (admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin
    const adminUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // In a real app, you would check for admin role
    // For now, we'll allow any authenticated user to view verification details
    // In production, add: if (adminUser.role !== 'admin') return 403

    const { userId } = await params;

    const verification = await db.verification.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            avatar: true,
            bio: true,
            location: true,
            website: true,
            createdAt: true,
          },
        },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: "Verification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: verification.id,
      type: verification.type,
      status: verification.status,
      verifiedAt: verification.verifiedAt,
      expiresAt: verification.expiresAt,
      createdAt: verification.createdAt,
      updatedAt: verification.updatedAt,
      businessName: verification.businessName,
      businessWebsite: verification.businessWebsite,
      businessCategory: verification.businessCategory,
      documentsUrl: verification.documentsUrl,
      officialEmail: verification.officialEmail,
      agencyName: verification.agencyName,
      notes: verification.notes,
      rejectionReason: verification.rejectionReason,
      user: verification.user,
    });
  } catch (error) {
    console.error("Error fetching verification details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
