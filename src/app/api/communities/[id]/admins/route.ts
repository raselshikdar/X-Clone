import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/communities/[id]/admins - Get admins list
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const community = await db.community.findUnique({
      where: { id },
    });

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    const admins = await db.communityMember.findMany({
      where: {
        communityId: id,
        role: { in: ["owner", "admin"] },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
            bio: true,
          },
        },
      },
      orderBy: [
        { role: "asc" }, // owner first
        { joinedAt: "asc" },
      ],
    });

    return NextResponse.json({
      admins: admins.map((admin) => ({
        id: admin.id,
        role: admin.role,
        joinedAt: admin.joinedAt,
        user: admin.user,
      })),
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/communities/[id]/admins - Promote member to admin (owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is owner
    const ownerMembership = await db.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: currentUser.id,
        },
      },
    });

    if (!ownerMembership || ownerMembership.role !== "owner") {
      return NextResponse.json(
        { error: "Only the owner can promote members to admin" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get member to promote
    const memberToPromote = await db.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
      },
    });

    if (!memberToPromote) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    if (memberToPromote.role === "admin" || memberToPromote.role === "owner") {
      return NextResponse.json(
        { error: "User is already an admin or owner" },
        { status: 400 }
      );
    }

    // Promote to admin
    const updatedMember = await db.communityMember.update({
      where: {
        communityId_userId: {
          communityId: id,
          userId,
        },
      },
      data: { role: "admin" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
      },
    });

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
        joinedAt: updatedMember.joinedAt,
        user: updatedMember.user,
      },
      message: "Member promoted to admin successfully",
    });
  } catch (error) {
    console.error("Error promoting member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/communities/[id]/admins - Demote admin (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is owner
    const ownerMembership = await db.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId: currentUser.id,
        },
      },
    });

    if (!ownerMembership || ownerMembership.role !== "owner") {
      return NextResponse.json(
        { error: "Only the owner can demote admins" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get admin to demote
    const adminToDemote = await db.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: id,
          userId,
        },
      },
    });

    if (!adminToDemote) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    if (adminToDemote.role !== "admin") {
      return NextResponse.json(
        { error: "User is not an admin" },
        { status: 400 }
      );
    }

    // Demote to member
    const updatedMember = await db.communityMember.update({
      where: {
        communityId_userId: {
          communityId: id,
          userId,
        },
      },
      data: { role: "member" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
      },
    });

    return NextResponse.json({
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
        joinedAt: updatedMember.joinedAt,
        user: updatedMember.user,
      },
      message: "Admin demoted to member successfully",
    });
  } catch (error) {
    console.error("Error demoting admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
