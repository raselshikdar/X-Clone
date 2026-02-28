import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/tweets/[id]/bookmark - Bookmark a tweet
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
      select: { id: true },
    });

    if (!tweet) {
      return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
    }

    // Check if already bookmarked
    const existingBookmark = await db.bookmark.findUnique({
      where: {
        userId_tweetId: {
          userId: session.user.id,
          tweetId: id,
        },
      },
    });

    if (existingBookmark) {
      return NextResponse.json({ error: "Already bookmarked" }, { status: 400 });
    }

    // Create bookmark
    await db.bookmark.create({
      data: {
        userId: session.user.id,
        tweetId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error bookmarking tweet:", error);
    return NextResponse.json({ error: "Failed to bookmark tweet" }, { status: 500 });
  }
}

// DELETE /api/tweets/[id]/bookmark - Remove bookmark
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

    // Delete bookmark
    const bookmark = await db.bookmark.delete({
      where: {
        userId_tweetId: {
          userId: session.user.id,
          tweetId: id,
        },
      },
    }).catch(() => null);

    if (!bookmark) {
      return NextResponse.json({ error: "Bookmark not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing bookmark:", error);
    return NextResponse.json({ error: "Failed to remove bookmark" }, { status: 500 });
  }
}
