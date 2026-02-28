import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/tweets/[id]/retweet - Retweet a tweet
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if tweet exists
    const tweet = await db.tweet.findUnique({
      where: { id, deletedAt: null },
      select: { authorId: true },
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Check if already retweeted
    const existingRetweet = await db.retweet.findUnique({
      where: {
        userId_tweetId: {
          userId: session.user.id,
          tweetId: id,
        },
      },
    });

    if (existingRetweet) {
      return NextResponse.json({ error: "Already retweeted" }, { status: 400 });
    }

    // Create retweet
    await db.retweet.create({
      data: {
        userId: session.user.id,
        tweetId: id,
      },
    });

    // Create notification
    if (tweet.authorId !== session.user.id) {
      await db.notification.create({
        data: {
          type: "retweet",
          userId: tweet.authorId,
          actorId: session.user.id,
          tweetId: id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error retweeting:", error);
    return NextResponse.json({ error: "Failed to retweet" }, { status: 500 });
  }
}

// DELETE /api/tweets/[id]/retweet - Undo retweet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete retweet
    const retweet = await db.retweet.delete({
      where: {
        userId_tweetId: {
          userId: session.user.id,
          tweetId: id,
        },
      },
    }).catch(() => null);

    if (!retweet) {
      return NextResponse.json({ error: "Retweet not found" }, { status: 404 });
    }

    // Delete notification
    await db.notification.deleteMany({
      where: {
        type: "retweet",
        tweetId: id,
        actorId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error undoing retweet:", error);
    return NextResponse.json({ error: "Failed to undo retweet" }, { status: 500 });
  }
}
