import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/tweets/[id]/like - Like a tweet
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

    // Check if already liked
    const existingLike = await db.like.findUnique({
      where: {
        userId_tweetId: {
          userId: session.user.id,
          tweetId: id,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }

    // Create like
    await db.like.create({
      data: {
        userId: session.user.id,
        tweetId: id,
      },
    });

    // Create notification
    if (tweet.authorId !== session.user.id) {
      await db.notification.create({
        data: {
          type: "like",
          userId: tweet.authorId,
          actorId: session.user.id,
          tweetId: id,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error liking tweet:", error);
    return NextResponse.json({ error: "Failed to like tweet" }, { status: 500 });
  }
}

// DELETE /api/tweets/[id]/like - Unlike a tweet
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

    // Delete like
    const like = await db.like.delete({
      where: {
        userId_tweetId: {
          userId: session.user.id,
          tweetId: id,
        },
      },
    }).catch(() => null);

    if (!like) {
      return NextResponse.json({ error: "Like not found" }, { status: 404 });
    }

    // Delete notification
    await db.notification.deleteMany({
      where: {
        type: "like",
        tweetId: id,
        actorId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unliking tweet:", error);
    return NextResponse.json({ error: "Failed to unlike tweet" }, { status: 500 });
  }
}
