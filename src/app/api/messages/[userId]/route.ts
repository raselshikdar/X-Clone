import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/messages/[userId] - Get messages with specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();
    const currentUserId = (session?.user as { id?: string })?.id;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: otherUserId } = await params;

    // Check if the other user exists
    const otherUser = await db.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        verified: true,
      },
    });

    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "30", 10);

    // Find conversation
    const conversation = await db.conversation.findFirst({
      where: {
        OR: [
          {
            AND: [
              { participant1Id: currentUserId },
              { participant2Id: otherUserId },
            ],
          },
          {
            AND: [
              { participant1Id: otherUserId },
              { participant2Id: currentUserId },
            ],
          },
        ],
      },
    });

    if (!conversation) {
      return NextResponse.json({
        messages: [],
        nextCursor: null,
        user: otherUser,
      });
    }

    // Get messages (oldest to newest for display)
    const messages = await db.directMessage.findMany({
      where: {
        conversationId: conversation.id,
        OR: [
          {
            AND: [
              { senderId: currentUserId },
              { deletedForSender: false },
            ],
          },
          {
            AND: [
              { recipientId: currentUserId },
              { deletedForRecipient: false },
            ],
          },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    // Mark messages as read
    await db.directMessage.updateMany({
      where: {
        conversationId: conversation.id,
        recipientId: currentUserId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const nextItem = messages.pop();
      nextCursor = nextItem!.id;
    }

    // Reverse to get oldest to newest
    const reversedMessages = messages.reverse();

    return NextResponse.json({
      messages: reversedMessages,
      nextCursor,
      user: otherUser,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}

// POST /api/messages/[userId] - Send message to user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession();
    const currentUserId = (session?.user as { id?: string })?.id;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: recipientId } = await params;

    if (recipientId === currentUserId) {
      return NextResponse.json(
        { error: "Cannot send message to yourself" },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content, mediaUrl, replyToId } = body;

    if (!content?.trim() && !mediaUrl) {
      return NextResponse.json(
        { error: "Message must have content or media" },
        { status: 400 }
      );
    }

    // Find or create conversation
    let conversation = await db.conversation.findFirst({
      where: {
        OR: [
          {
            AND: [
              { participant1Id: currentUserId },
              { participant2Id: recipientId },
            ],
          },
          {
            AND: [
              { participant1Id: recipientId },
              { participant2Id: currentUserId },
            ],
          },
        ],
      },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          participant1Id: currentUserId,
          participant2Id: recipientId,
        },
      });
    }

    // Create message
    const message = await db.directMessage.create({
      data: {
        senderId: currentUserId,
        recipientId: recipientId,
        conversationId: conversation.id,
        content: content?.trim() || null,
        mediaUrl: mediaUrl || null,
        hasMedia: !!mediaUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
        recipient: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
      },
    });

    // Update conversation's lastMessageAt
    await db.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ message, conversationId: conversation.id });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
