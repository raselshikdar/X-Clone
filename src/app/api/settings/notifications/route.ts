import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/settings/notifications - Get notification preferences
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        settings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create default settings if not exist
    const settings = user.settings || {
      notificationsEnabled: true,
      emailNotifications: true,
      pushNotifications: true,
      notifyLikes: true,
      notifyRetweets: true,
      notifyFollows: true,
      notifyMentions: true,
      notifyReplies: true,
      notifyDMs: true,
    };

    return NextResponse.json({
      notificationsEnabled: settings.notificationsEnabled,
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      notifyLikes: settings.notifyLikes,
      notifyRetweets: settings.notifyRetweets,
      notifyFollows: settings.notifyFollows,
      notifyMentions: settings.notifyMentions,
      notifyReplies: settings.notifyReplies,
      notifyDMs: settings.notifyDMs,
    });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/notifications - Update notification preferences
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      notificationsEnabled,
      emailNotifications,
      pushNotifications,
      notifyLikes,
      notifyRetweets,
      notifyFollows,
      notifyMentions,
      notifyReplies,
      notifyDMs,
    } = body;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update notification settings
    const settings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: {
        notificationsEnabled: notificationsEnabled ?? undefined,
        emailNotifications: emailNotifications ?? undefined,
        pushNotifications: pushNotifications ?? undefined,
        notifyLikes: notifyLikes ?? undefined,
        notifyRetweets: notifyRetweets ?? undefined,
        notifyFollows: notifyFollows ?? undefined,
        notifyMentions: notifyMentions ?? undefined,
        notifyReplies: notifyReplies ?? undefined,
        notifyDMs: notifyDMs ?? undefined,
      },
      create: {
        userId: user.id,
        notificationsEnabled: notificationsEnabled ?? true,
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? true,
        notifyLikes: notifyLikes ?? true,
        notifyRetweets: notifyRetweets ?? true,
        notifyFollows: notifyFollows ?? true,
        notifyMentions: notifyMentions ?? true,
        notifyReplies: notifyReplies ?? true,
        notifyDMs: notifyDMs ?? true,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        notificationsEnabled: settings.notificationsEnabled,
        emailNotifications: settings.emailNotifications,
        pushNotifications: settings.pushNotifications,
        notifyLikes: settings.notifyLikes,
        notifyRetweets: settings.notifyRetweets,
        notifyFollows: settings.notifyFollows,
        notifyMentions: settings.notifyMentions,
        notifyReplies: settings.notifyReplies,
        notifyDMs: settings.notifyDMs,
      },
    });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
