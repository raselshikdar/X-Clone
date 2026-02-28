import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/settings/appearance - Get appearance settings
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
      darkMode: false,
      theme: "system",
      fontSize: "medium",
      displayLanguage: "en",
    };

    return NextResponse.json({
      darkMode: settings.darkMode,
      theme: settings.theme,
      fontSize: settings.fontSize,
      displayLanguage: settings.displayLanguage,
    });
  } catch (error) {
    console.error("Error fetching appearance settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/appearance - Update appearance settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { darkMode, theme, fontSize, displayLanguage } = body;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Validate theme value
    const validThemes = ["light", "dark", "system"];
    const validFontSizes = ["small", "medium", "large"];

    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme value" },
        { status: 400 }
      );
    }

    if (fontSize && !validFontSizes.includes(fontSize)) {
      return NextResponse.json(
        { error: "Invalid font size value" },
        { status: 400 }
      );
    }

    // Update appearance settings
    const settings = await db.userSettings.upsert({
      where: { userId: user.id },
      update: {
        darkMode: darkMode ?? undefined,
        theme: theme ?? undefined,
        fontSize: fontSize ?? undefined,
        displayLanguage: displayLanguage ?? undefined,
      },
      create: {
        userId: user.id,
        darkMode: darkMode ?? false,
        theme: theme ?? "system",
        fontSize: fontSize ?? "medium",
        displayLanguage: displayLanguage ?? "en",
      },
    });

    return NextResponse.json({
      success: true,
      settings: {
        darkMode: settings.darkMode,
        theme: settings.theme,
        fontSize: settings.fontSize,
        displayLanguage: settings.displayLanguage,
      },
    });
  } catch (error) {
    console.error("Error updating appearance settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
