import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/messages/read - Mark messages as read
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { messageIds, conversationId, senderId } = body;

    // If specific message IDs are provided
    if (messageIds && Array.isArray(messageIds)) {
      await db.directMessage.updateMany({
        where: {
          id: { in: messageIds },
          recipientId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, count: messageIds.length });
    }

    // If conversationId is provided, mark all unread messages in that conversation
    if (conversationId) {
      const result = await db.directMessage.updateMany({
        where: {
          conversationId,
          recipientId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, count: result.count });
    }

    // If senderId is provided, mark all unread messages from that sender
    if (senderId) {
      const result = await db.directMessage.updateMany({
        where: {
          senderId,
          recipientId: userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, count: result.count });
    }

    return NextResponse.json(
      { error: "Either messageIds, conversationId, or senderId is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Mark as read error:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
