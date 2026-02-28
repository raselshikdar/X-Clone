import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/notifications/settings - Get notification settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user settings
    const settings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Return default settings if not found
    const notificationSettings = {
      notificationsEnabled: settings?.notificationsEnabled ?? true,
      emailNotifications: settings?.emailNotifications ?? true,
      pushNotifications: true, // Default for push
      likes: true, // Notifications for likes
      retweets: true, // Notifications for retweets
      follows: true, // Notifications for new followers
      mentions: true, // Notifications for mentions
      replies: true, // Notifications for replies
      quotes: true, // Notifications for quote tweets
    };

    return NextResponse.json(notificationSettings);
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json({ error: "Failed to fetch notification settings" }, { status: 500 });
  }
}

// PUT /api/notifications/settings - Update notification settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      notificationsEnabled,
      emailNotifications,
    } = body;

    // Update user settings
    const settings = await db.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        notificationsEnabled: notificationsEnabled ?? true,
        emailNotifications: emailNotifications ?? true,
      },
      update: {
        ...(notificationsEnabled !== undefined && { notificationsEnabled }),
        ...(emailNotifications !== undefined && { emailNotifications }),
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        notificationsEnabled: settings.notificationsEnabled,
        emailNotifications: settings.emailNotifications,
      },
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json({ error: "Failed to update notification settings" }, { status: 500 });
  }
}
