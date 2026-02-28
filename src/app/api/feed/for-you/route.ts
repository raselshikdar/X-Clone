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

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Get user interests based on likes and follows
    let followingIds: string[] = [];
    let likedTweetIds: string[] = [];

    if (userId) {
      const [follows, likes] = await Promise.all([
        db.follow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        }),
        db.like.findMany({
          where: { userId },
          select: { tweetId: true },
          take: 100,
        }),
      ]);
      followingIds = follows.map((f) => f.followingId);
      likedTweetIds = likes.map((l) => l.tweetId);
    }

    // Get hashtags from liked tweets for recommendations
    let interestHashtagIds: string[] = [];
    if (likedTweetIds.length > 0) {
      const hashtagLinks = await db.tweetHashtag.findMany({
        where: { tweetId: { in: likedTweetIds } },
        select: { hashtagId: true },
        take: 50,
      });
      interestHashtagIds = [...new Set(hashtagLinks.map((h) => h.hashtagId))];
    }

    // Get tweets with interest-based scoring
    const tweets = await db.tweet.findMany({
      where: {
        deletedAt: null,
        inReplyToId: null,
        retweetOfId: null,
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
          where: { userId: userId || "" },
          select: { userId: true },
        },
        retweetRecords: {
          where: { userId: userId || "" },
          select: { userId: true },
        },
        bookmarks: {
          where: { userId: userId || "" },
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

    // Score and sort tweets
    const scoredTweets = tweets.map((tweet) => {
      let score = 0;

      // Boost for followed users
      if (followingIds.includes(tweet.authorId)) {
        score += 100;
      }

      // Boost for engagement
      score += tweet._count.likes * 0.5;
      score += tweet._count.retweetRecords * 1;
      score += tweet._count.replies * 0.3;

      // Boost for verified authors
      if (tweet.author.verified) {
        score += 10;
      }

      // Time decay - newer tweets get higher scores
      const hoursSinceCreation =
        (Date.now() - tweet.createdAt.getTime()) / (1000 * 60 * 60);
      score -= hoursSinceCreation * 0.1;

      return { tweet, score };
    });

    // Sort by score (higher is better)
    scoredTweets.sort((a, b) => b.score - a.score);

    let nextCursor: string | null = null;
    const limitedTweets = scoredTweets.slice(0, limit + 1);
    if (limitedTweets.length > limit) {
      const nextItem = limitedTweets.pop();
      nextCursor = nextItem!.tweet.id;
    }

    const formattedTweets = limitedTweets.map((t) =>
      formatTweet(t.tweet, userId)
    );

    return NextResponse.json({
      tweets: formattedTweets,
      nextCursor,
    });
  } catch (error) {
    console.error("For You feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch For You feed" },
      { status: 500 }
    );
  }
}
