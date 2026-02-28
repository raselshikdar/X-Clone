import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/communities/[id]/tweets - Get community tweets
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const cursor = searchParams.get("cursor");

    const tweets = await db.tweet.findMany({
      where: { communityId: id, deletedAt: null },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true, verified: true },
        },
        media: true,
        _count: { select: { likes: true, retweets: true, replies: true } },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (tweets.length > limit) {
      const nextItem = tweets.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ tweets, nextCursor });
  } catch (error) {
    console.error("Get community tweets error:", error);
    return NextResponse.json({ error: "Failed to get tweets" }, { status: 500 });
  }
}

// POST /api/communities/[id]/tweets - Post to community
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check membership
    const membership = await db.communityMember.findFirst({
      where: { communityId: id, userId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Must be a member to post" }, { status: 403 });
    }

    const body = await request.json();
    const { content, hasMedia, sensitiveContent } = body;

    if (!content?.trim() && !hasMedia) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const tweet = await db.tweet.create({
      data: {
        content: content?.trim(),
        authorId: userId,
        communityId: id,
        hasMedia: hasMedia || false,
        sensitiveContent: sensitiveContent || false,
      },
      include: {
        author: {
          select: { id: true, username: true, displayName: true, avatar: true, verified: true },
        },
      },
    });

    return NextResponse.json({ tweet }, { status: 201 });
  } catch (error) {
    console.error("Post to community error:", error);
    return NextResponse.json({ error: "Failed to post" }, { status: 500 });
  }
}
