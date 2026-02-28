import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/users/me - Get current authenticated user
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        verification: true,
        settings: true,
        _count: {
          select: {
            followers: true,
            following: true,
            tweets: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      banner: user.banner,
      location: user.location,
      website: user.website,
      birthDate: user.birthDate,
      verified: user.verified,
      verifiedAt: user.verifiedAt,
      verification: user.verification,
      isPrivate: user.isPrivate,
      createdAt: user.createdAt,
      settings: user.settings,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      tweetsCount: user._count.tweets,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/users/me - Update current user settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { darkMode, notificationsEnabled, emailNotifications, dmFromAnyone, showReadReceipts, allowTagging } = body;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update or create user settings
    const settings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: {
        darkMode: darkMode ?? undefined,
        notificationsEnabled: notificationsEnabled ?? undefined,
        emailNotifications: emailNotifications ?? undefined,
        dmFromAnyone: dmFromAnyone ?? undefined,
        showReadReceipts: showReadReceipts ?? undefined,
        allowTagging: allowTagging ?? undefined,
      },
      create: {
        userId: user.id,
        darkMode: darkMode ?? false,
        notificationsEnabled: notificationsEnabled ?? true,
        emailNotifications: emailNotifications ?? true,
        dmFromAnyone: dmFromAnyone ?? true,
        showReadReceipts: showReadReceipts ?? true,
        allowTagging: allowTagging ?? true,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
