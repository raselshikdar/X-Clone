import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

interface TweetWithAuthor {
  id: string;
  content: string | null;
  authorId: string;
  inReplyToId: string | null;
  quotedTweetId: string | null;
  retweetOfId: string | null;
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
    bookmarks: number;
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
  bookmarks: tweet._count.bookmarks,
  isLiked: userId ? tweet.likes.some((l) => l.userId === userId) : false,
  isRetweeted: userId
    ? tweet.retweetRecords.some((r) => r.userId === userId)
    : false,
  isBookmarked: userId
    ? tweet.bookmarks.some((b) => b.userId === userId)
    : false,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> }
) {
  try {
    const { tag } = await params;
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id || null;

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get("tab") || "top"; // top, latest, media
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    // Normalize tag (remove # if present)
    const normalizedTag = tag.startsWith("#") ? tag.slice(1) : tag;

    // Find the hashtag
    const hashtag = await db.hashtag.findFirst({
      where: {
        name: { equals: normalizedTag, mode: "insensitive" },
      },
    });

    if (!hashtag) {
      return NextResponse.json({
        tweets: [],
        hashtag: {
          name: normalizedTag,
          tweetCount: 0,
          isFollowing: false,
        },
        nextCursor: null,
      });
    }

    // Check if user is following this hashtag
    let isFollowing = false;
    if (userId) {
      // Check if there's a follow relationship for hashtags
      // For now, we'll use bookmarks as a proxy or return false
      isFollowing = false;
    }

    // Build the where clause
    const whereClause: {
      deletedAt: null;
      hashtags: { some: { hashtagId: string } };
      inReplyToId?: null;
      hasMedia?: boolean;
    } = {
      deletedAt: null,
      hashtags: {
        some: { hashtagId: hashtag.id },
      },
    };

    // Apply tab-specific filters
    if (tab === "media") {
      whereClause.hasMedia = true;
    }

    // Build order by
    let orderBy: Record<string, "desc" | "asc">[] = [{ createdAt: "desc" }];
    if (tab === "top") {
      // Order by engagement for top tweets
      orderBy = [{ createdAt: "desc" }];
    }

    // Get tweets with this hashtag
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
            bookmarks: true,
          },
        },
      },
      orderBy,
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
      hashtag: {
        name: hashtag.name,
        tweetCount: hashtag.tweetCount,
        isFollowing,
      },
      nextCursor,
    });
  } catch (error) {
    console.error("Hashtag error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hashtag tweets" },
      { status: 500 }
    );
  }
}
