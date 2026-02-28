import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// GET /api/settings/sessions - Get active sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all active sessions for the user
    const sessions = await db.session.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActive: "desc" },
    });

    // Get current session info from headers
    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               "Unknown";

    // Parse user agent for device info
    const getDeviceInfo = (ua: string) => {
      let device = "Desktop";
      let browser = "Unknown";
      let os = "Unknown";

      // Detect device type
      if (/mobile/i.test(ua)) {
        device = /tablet/i.test(ua) ? "Tablet" : "Mobile";
      }

      // Detect browser
      if (/firefox/i.test(ua)) browser = "Firefox";
      else if (/edg/i.test(ua)) browser = "Edge";
      else if (/chrome/i.test(ua)) browser = "Chrome";
      else if (/safari/i.test(ua)) browser = "Safari";
      else if (/opera|opr/i.test(ua)) browser = "Opera";

      // Detect OS
      if (/windows/i.test(ua)) os = "Windows";
      else if (/mac/i.test(ua)) os = "macOS";
      else if (/linux/i.test(ua)) os = "Linux";
      else if (/android/i.test(ua)) os = "Android";
      else if (/ios|iphone|ipad/i.test(ua)) os = "iOS";

      return { device, browser, os };
    };

    const currentDeviceInfo = getDeviceInfo(userAgent);

    // Format sessions
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      device: s.device || "Unknown",
      browser: s.browser || "Unknown",
      os: s.os || "Unknown",
      location: s.location || "Unknown",
      lastActive: s.lastActive,
      createdAt: s.createdAt,
      isCurrent: s.userAgent === userAgent,
    }));

    return NextResponse.json({
      currentSession: {
        device: currentDeviceInfo.device,
        browser: currentDeviceInfo.browser,
        os: currentDeviceInfo.os,
        ipAddress: ip,
      },
      sessions: formattedSessions,
    });
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/sessions - Logout from other devices
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (sessionId) {
      // Logout from specific session
      await db.session.delete({
        where: {
          id: sessionId,
          userId: user.id,
        },
      });
    } else {
      // Logout from all other sessions
      // Get current session info
      const userAgent = request.headers.get("user-agent") || "";

      // Delete all sessions except current
      await db.session.deleteMany({
        where: {
          userId: user.id,
          NOT: {
            userAgent,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/settings/sessions - Create a new session record (for tracking)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userAgent = request.headers.get("user-agent") || "Unknown";
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               null;

    // Parse user agent for device info
    const getDeviceInfo = (ua: string) => {
      let device = "Desktop";
      let browser = "Unknown";
      let os = "Unknown";

      if (/mobile/i.test(ua)) {
        device = /tablet/i.test(ua) ? "Tablet" : "Mobile";
      }

      if (/firefox/i.test(ua)) browser = "Firefox";
      else if (/edg/i.test(ua)) browser = "Edge";
      else if (/chrome/i.test(ua)) browser = "Chrome";
      else if (/safari/i.test(ua)) browser = "Safari";
      else if (/opera|opr/i.test(ua)) browser = "Opera";

      if (/windows/i.test(ua)) os = "Windows";
      else if (/mac/i.test(ua)) os = "macOS";
      else if (/linux/i.test(ua)) os = "Linux";
      else if (/android/i.test(ua)) os = "Android";
      else if (/ios|iphone|ipad/i.test(ua)) os = "iOS";

      return { device, browser, os };
    };

    const deviceInfo = getDeviceInfo(userAgent);

    // Create session
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await db.session.create({
      data: {
        userId: user.id,
        token,
        userAgent,
        ipAddress: ip,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        expiresAt,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
