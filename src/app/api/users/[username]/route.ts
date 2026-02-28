import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/users/[username] - Get user profile by username
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const session = await getServerSession();

    // Find the user by username
    const user = await db.user.findUnique({
      where: { username },
      include: {
        verification: true,
        _count: {
          select: {
            followers: true,
            following: true,
            tweets: { where: { deletedAt: null, inReplyToId: null } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get current user if authenticated
    let currentUser = null;
    if (session?.user?.email) {
      currentUser = await db.user.findUnique({
        where: { email: session.user.email },
      });
    }

    // Check if current user is following this user
    let isFollowing = false;
    let isBlocked = false;
    let hasBlocked = false;

    if (currentUser) {
      const followRecord = await db.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: user.id,
          },
        },
      });
      isFollowing = !!followRecord;

      // Check if blocked by user
      const blockedRecord = await db.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: user.id,
            blockedId: currentUser.id,
          },
        },
      });
      isBlocked = !!blockedRecord;

      // Check if current user has blocked this user
      const hasBlockedRecord = await db.block.findUnique({
        where: {
          blockerId_blockedId: {
            blockerId: currentUser.id,
            blockedId: user.id,
          },
        },
      });
      hasBlocked = !!hasBlockedRecord;
    }

    // If blocked by user, return not found
    if (isBlocked) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // For private accounts, hide sensitive info unless following
    const isOwnProfile = currentUser?.id === user.id;
    const canViewFullProfile = !user.isPrivate || isFollowing || isOwnProfile;

    const responseData = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: canViewFullProfile ? user.bio : null,
      avatar: user.avatar,
      banner: user.banner,
      location: canViewFullProfile ? user.location : null,
      website: canViewFullProfile ? user.website : null,
      birthDate: canViewFullProfile ? user.birthDate : null,
      verified: user.verified,
      verifiedAt: user.verifiedAt,
      verification: user.verification,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      tweetsCount: user._count.tweets,
      isFollowing,
      isBlocked: hasBlocked,
      isOwnProfile,
      canViewFullProfile,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[username] - Update user profile
export async function PUT(
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

    // Only allow updating own profile
    if (currentUser.username !== username) {
      return NextResponse.json(
        { error: "You can only update your own profile" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { displayName, bio, location, website, birthDate, isPrivate } = body;

    // Validate input
    if (displayName !== undefined && displayName !== null && displayName.length > 50) {
      return NextResponse.json(
        { error: "Display name must be 50 characters or less" },
        { status: 400 }
      );
    }

    if (bio !== undefined && bio !== null && bio.length > 160) {
      return NextResponse.json(
        { error: "Bio must be 160 characters or less" },
        { status: 400 }
      );
    }

    if (location !== undefined && location !== null && location.length > 30) {
      return NextResponse.json(
        { error: "Location must be 30 characters or less" },
        { status: 400 }
      );
    }

    // Validate website URL if provided
    if (website !== undefined && website !== null && website !== "") {
      try {
        new URL(website.startsWith("http") ? website : `https://${website}`);
      } catch {
        return NextResponse.json(
          { error: "Invalid website URL" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: currentUser.id },
      data: {
        displayName: displayName ?? undefined,
        bio: bio ?? undefined,
        location: location ?? undefined,
        website: website ?? undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        isPrivate: isPrivate ?? undefined,
      },
      include: {
        verification: true,
        _count: {
          select: {
            followers: true,
            following: true,
            tweets: { where: { deletedAt: null } },
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      displayName: updatedUser.displayName,
      bio: updatedUser.bio,
      avatar: updatedUser.avatar,
      banner: updatedUser.banner,
      location: updatedUser.location,
      website: updatedUser.website,
      birthDate: updatedUser.birthDate,
      verified: updatedUser.verified,
      verifiedAt: updatedUser.verifiedAt,
      verification: updatedUser.verification,
      isPrivate: updatedUser.isPrivate,
      createdAt: updatedUser.createdAt,
      followersCount: updatedUser._count.followers,
      followingCount: updatedUser._count.following,
      tweetsCount: updatedUser._count.tweets,
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
