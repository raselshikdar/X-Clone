import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// DELETE /api/messages/delete/[messageId] - Delete message (for sender only or both)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await params;
    const { searchParams } = new URL(request.url);
    const deleteForEveryone = searchParams.get("forEveryone") === "true";

    // Find the message
    const message = await db.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      // User is not the sender, they can only delete for themselves (recipient)
      if (message.recipientId !== userId) {
        return NextResponse.json(
          { error: "You can only delete your own messages" },
          { status: 403 }
        );
      }

      // Mark as deleted for recipient
      await db.directMessage.update({
        where: { id: messageId },
        data: { deletedForRecipient: true },
      });

      return NextResponse.json({ success: true, deletedFor: "self" });
    }

    // User is the sender
    if (deleteForEveryone) {
      // Delete for both parties
      await db.directMessage.update({
        where: { id: messageId },
        data: {
          deletedForSender: true,
          deletedForRecipient: true,
        },
      });
      return NextResponse.json({ success: true, deletedFor: "everyone" });
    } else {
      // Delete only for sender
      await db.directMessage.update({
        where: { id: messageId },
        data: { deletedForSender: true },
      });
      return NextResponse.json({ success: true, deletedFor: "self" });
    }
  } catch (error) {
    console.error("Delete message error:", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
