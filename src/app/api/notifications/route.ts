import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Build the where clause based on type filter
    const whereClause: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (type !== "all") {
      whereClause.type = type;
    }

    // Handle multiple types for mentions
    if (type === "mentions") {
      whereClause.type = "mention";
    }

    const notifications = await db.notification.findMany({
      where: whereClause,
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verification: { select: { type: true } },
          },
        },
        tweet: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                verification: { select: { type: true } },
              },
            },
            media: { orderBy: { order: "asc" } },
            inReplyTo: {
              select: {
                id: true,
                content: true,
                author: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
    });

    let nextCursor: string | undefined;
    if (notifications.length > limit) {
      const nextItem = notifications.pop();
      nextCursor = nextItem?.id;
    }

    // Group notifications by type and actor for display
    // For example, multiple likes on the same tweet can be grouped
    const transformedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      read: notification.read,
      createdAt: notification.createdAt,
      actor: {
        id: notification.actor.id,
        username: notification.actor.username,
        name: notification.actor.displayName || notification.actor.username,
        avatar: notification.actor.avatar,
        verified: !!notification.actor.verification,
      },
      tweet: notification.tweet
        ? {
            id: notification.tweet.id,
            content: notification.tweet.content,
            createdAt: notification.tweet.createdAt,
            author: {
              id: notification.tweet.author.id,
              username: notification.tweet.author.username,
              name: notification.tweet.author.displayName || notification.tweet.author.username,
              avatar: notification.tweet.author.avatar,
              verified: !!notification.tweet.author.verification,
            },
            media: notification.tweet.media.map((m) => ({
              id: m.id,
              type: m.type,
              url: m.url,
              thumbnail: m.thumbnailUrl,
            })),
            inReplyTo: notification.tweet.inReplyTo
              ? {
                  id: notification.tweet.inReplyTo.id,
                  content: notification.tweet.inReplyTo.content,
                  authorName: notification.tweet.inReplyTo.author.displayName || notification.tweet.inReplyTo.author.username,
                }
              : null,
          }
        : null,
    }));

    // Get unread count
    const unreadCount = await db.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    return NextResponse.json({
      notifications: transformedNotifications,
      nextCursor,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "Notification IDs required" }, { status: 400 });
    }

    // Mark specified notifications as read
    await db.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: session.user.id,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
