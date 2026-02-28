import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/users/[username]/follow - Follow a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the user to follow
    const userToFollow = await db.user.findUnique({
      where: { username },
    });

    if (!userToFollow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Can't follow yourself
    if (currentUser.id === userToFollow.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: userToFollow.id,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 400 }
      );
    }

    // Check if blocked
    const blockedRecord = await db.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: userToFollow.id,
          blockedId: currentUser.id,
        },
      },
    });

    if (blockedRecord) {
      return NextResponse.json(
        { error: "Cannot follow this user" },
        { status: 403 }
      );
    }

    // Create follow relationship
    // For private accounts, the follow needs to be approved
    const follow = await db.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: userToFollow.id,
        approved: !userToFollow.isPrivate, // Auto-approve for public accounts
      },
    });

    // Create notification if approved
    if (follow.approved) {
      await db.notification.create({
        data: {
          type: "follow",
          userId: userToFollow.id,
          actorId: currentUser.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      following: true,
      pending: !follow.approved,
      message: follow.approved
        ? "Successfully followed"
        : "Follow request sent",
    });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[username]/follow - Unfollow a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the user to unfollow
    const userToUnfollow = await db.user.findUnique({
      where: { username },
    });

    if (!userToUnfollow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete follow relationship
    const follow = await db.follow.deleteMany({
      where: {
        followerId: currentUser.id,
        followingId: userToUnfollow.id,
      },
    });

    if (follow.count === 0) {
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      following: false,
    });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
