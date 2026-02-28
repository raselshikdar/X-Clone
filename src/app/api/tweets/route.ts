import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// Helper function to extract mentions from content
function extractMentions(content: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  // Return unique mentions
  return [...new Set(mentions)];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, media, inReplyToId, quotedTweetId } = body;

    if (!content?.trim() && (!media || media.length === 0)) {
      return NextResponse.json(
        { error: "Tweet must have content or media" },
        { status: 400 }
      );
    }

    if (content && content.length > 280) {
      return NextResponse.json(
        { error: "Tweet must be 280 characters or less" },
        { status: 400 }
      );
    }

    // Create the tweet
    const tweet = await db.tweet.create({
      data: {
        content: content?.trim() || null,
        authorId: userId,
        hasMedia: media && media.length > 0,
        inReplyToId: inReplyToId || undefined,
        quotedTweetId: quotedTweetId || undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
        media: true,
        inReplyTo: {
          select: {
            id: true,
            authorId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            retweetRecords: true,
            replies: true,
          },
        },
      },
    });

    // Create notifications
    if (content) {
      // Extract and create mention notifications
      const mentionedUsernames = extractMentions(content);
      if (mentionedUsernames.length > 0) {
        const mentionedUsers = await db.user.findMany({
          where: {
            username: { in: mentionedUsernames },
          },
          select: { id: true },
        });

        // Create mention notifications for each mentioned user (excluding self)
        for (const mentionedUser of mentionedUsers) {
          if (mentionedUser.id !== userId) {
            await db.notification.create({
              data: {
                type: "mention",
                userId: mentionedUser.id,
                actorId: userId,
                tweetId: tweet.id,
              },
            });
          }
        }
      }
    }

    // Create reply notification if this is a reply
    if (inReplyToId && tweet.inReplyTo && tweet.inReplyTo.authorId !== userId) {
      await db.notification.create({
        data: {
          type: "reply",
          userId: tweet.inReplyTo.authorId,
          actorId: userId,
          tweetId: tweet.id,
        },
      });
    }

    // Create quote notification if this is a quote tweet
    if (quotedTweetId) {
      const quotedTweet = await db.tweet.findUnique({
        where: { id: quotedTweetId },
        select: { authorId: true },
      });

      if (quotedTweet && quotedTweet.authorId !== userId) {
        await db.notification.create({
          data: {
            type: "quote",
            userId: quotedTweet.authorId,
            actorId: userId,
            tweetId: tweet.id,
          },
        });
      }
    }

    return NextResponse.json({ tweet });
  } catch (error) {
    console.error("Create tweet error:", error);
    return NextResponse.json(
      { error: "Failed to create tweet" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const whereClause: {
      deletedAt: null;
      authorId?: string;
    } = {
      deletedAt: null,
    };

    if (userId) {
      whereClause.authorId = userId;
    }

    const tweets = await db.tweet.findMany({
      where: whereClause,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            verified: true,
          },
        },
        media: true,
        _count: {
          select: {
            likes: true,
            retweetRecords: true,
            replies: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
    });

    let nextCursor: string | null = null;
    if (tweets.length > limit) {
      const nextItem = tweets.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ tweets, nextCursor });
  } catch (error) {
    console.error("Get tweets error:", error);
    return NextResponse.json(
      { error: "Failed to get tweets" },
      { status: 500 }
    );
  }
}
