import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/settings/privacy - Get privacy settings
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
      isPrivate: user.isPrivate,
      dmFromAnyone: true,
      showReadReceipts: true,
      allowTagging: true,
      whoCanReply: "everyone",
      locationEnabled: false,
    };

    return NextResponse.json({
      isPrivate: user.isPrivate,
      dmFromAnyone: settings.dmFromAnyone,
      showReadReceipts: settings.showReadReceipts,
      allowTagging: settings.allowTagging,
      whoCanReply: settings.whoCanReply,
      locationEnabled: settings.locationEnabled,
    });
  } catch (error) {
    console.error("Error fetching privacy settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/privacy - Update privacy settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      isPrivate,
      dmFromAnyone,
      showReadReceipts,
      allowTagging,
      whoCanReply,
      locationEnabled,
    } = body;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user's private status
    if (isPrivate !== undefined) {
      await db.user.update({
        where: { id: user.id },
        data: { isPrivate },
      });
    }

    // Update privacy settings
    const settings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: {
        dmFromAnyone: dmFromAnyone ?? undefined,
        showReadReceipts: showReadReceipts ?? undefined,
        allowTagging: allowTagging ?? undefined,
        whoCanReply: whoCanReply ?? undefined,
        locationEnabled: locationEnabled ?? undefined,
      },
      create: {
        userId: user.id,
        dmFromAnyone: dmFromAnyone ?? true,
        showReadReceipts: showReadReceipts ?? true,
        allowTagging: allowTagging ?? true,
        whoCanReply: whoCanReply ?? "everyone",
        locationEnabled: locationEnabled ?? false,
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        isPrivate: isPrivate ?? user.isPrivate,
        dmFromAnyone: settings.dmFromAnyone,
        showReadReceipts: settings.showReadReceipts,
        allowTagging: settings.allowTagging,
        whoCanReply: settings.whoCanReply,
        locationEnabled: settings.locationEnabled,
      },
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
