import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/notifications/read-all - Mark all notifications as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark all notifications as read for the current user
    const result = await db.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ error: "Failed to mark all notifications as read" }, { status: 500 });
  }
}
