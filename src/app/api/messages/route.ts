import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/messages - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all conversations where user is participant1 or participant2
    const conversations = await db.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
        participant2: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          where: {
            OR: [
              { deletedForSender: false },
              {
                AND: [
                  { senderId: userId },
                  { deletedForSender: true },
                ],
              },
            ],
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                recipientId: userId,
                readAt: null,
                deletedForRecipient: false,
              },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    // Transform conversations for the response
    const transformedConversations = conversations.map((conv) => {
      // Determine the other participant
      const otherUser = conv.participant1Id === userId
        ? conv.participant2
        : conv.participant1;

      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        user: otherUser,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          mediaUrl: lastMessage.mediaUrl,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
        } : null,
        unreadCount: conv._count.messages,
        lastMessageAt: conv.lastMessageAt,
      };
    });

    return NextResponse.json({ conversations: transformedConversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return NextResponse.json(
      { error: "Failed to get conversations" },
      { status: 500 }
    );
  }
}

// POST /api/messages - Start new conversation / send message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, content, mediaUrl } = body;

    if (!recipientId) {
      return NextResponse.json(
        { error: "Recipient ID is required" },
        { status: 400 }
      );
    }

    if (!content?.trim() && !mediaUrl) {
      return NextResponse.json(
        { error: "Message must have content or media" },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const recipient = await db.user.findUnique({
      where: { id: recipientId },
      select: { id: true, username: true, displayName: true, avatar: true, verified: true },
    });

    if (!recipient) {
      return NextResponse.json(
        { error: "Recipient not found" },
        { status: 404 }
      );
    }

    // Check if user is trying to message themselves
    if (recipientId === userId) {
      return NextResponse.json(
        { error: "Cannot send message to yourself" },
        { status: 400 }
      );
    }

    // Find or create conversation
    let conversation = await db.conversation.findFirst({
      where: {
        OR: [
          {
            AND: [
              { participant1Id: userId },
              { participant2Id: recipientId },
            ],
          },
          {
            AND: [
              { participant1Id: recipientId },
              { participant2Id: userId },
            ],
          },
        ],
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await db.conversation.create({
        data: {
          participant1Id: userId,
          participant2Id: recipientId,
        },
      });
    }

    // Create message
    const message = await db.directMessage.create({
      data: {
        senderId: userId,
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
