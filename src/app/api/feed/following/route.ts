import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

interface TweetWithAuthor {
  id: string;
  content: string | null;
  authorId: string;
  inReplyToId: string | null;
  views: number;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
  };
  media: {
    id: string;
    type: string;
    url: string;
    thumbnailUrl: string | null;
  }[];
  _count: {
    likes: number;
    retweetRecords: number;
    replies: number;
  };
  likes: { userId: string }[];
  retweetRecords: { userId: string }[];
  bookmarks: { userId: string }[];
}

const formatTweet = (tweet: TweetWithAuthor, userId: string | null) => ({
  id: tweet.id,
  content: tweet.content || "",
  createdAt: tweet.createdAt,
  views: tweet.views,
  user: {
    id: tweet.author.id,
    name: tweet.author.displayName || tweet.author.username,
    username: tweet.author.username,
    avatar: tweet.author.avatar,
    verified: tweet.author.verified,
  },
  media: tweet.media.map((m) => ({
    id: m.id,
    type: m.type as "image" | "video",
    url: m.url,
    thumbnail: m.thumbnailUrl || undefined,
  })),
  replies: tweet._count.replies,
  retweets: tweet._count.retweetRecords,
  likes: tweet._count.likes,
  isLiked: userId ? tweet.likes.some((l) => l.userId === userId) : false,
  isRetweeted: userId
    ? tweet.retweetRecords.some((r) => r.userId === userId)
    : false,
  isBookmarked: userId
    ? tweet.bookmarks.some((b) => b.userId === userId)
    : false,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id || null;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Get following list
    const follows = await db.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = follows.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return NextResponse.json({
        tweets: [],
        nextCursor: null,
        message: "You're not following anyone yet",
      });
    }

    // Get tweets from followed users in chronological order
    const tweets = await db.tweet.findMany({
      where: {
        deletedAt: null,
        authorId: { in: followingIds },
        inReplyToId: null, // Don't show replies in timeline
        retweetOfId: null, // Don't show retweets as separate items
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
        media: {
          select: {
            id: true,
            type: true,
            url: true,
            thumbnailUrl: true,
          },
        },
        likes: {
          where: { userId },
          select: { userId: true },
        },
        retweetRecords: {
          where: { userId },
          select: { userId: true },
        },
        bookmarks: {
          where: { userId },
          select: { userId: true },
        },
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

    const formattedTweets = tweets.map((t) => formatTweet(t, userId));

    return NextResponse.json({
      tweets: formattedTweets,
      nextCursor,
    });
  } catch (error) {
    console.error("Following feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Following feed" },
      { status: 500 }
    );
  }
}
