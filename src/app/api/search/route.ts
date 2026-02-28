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
  inReplyTo?: {
    id: string;
    author: {
      id: string;
      username: string;
    };
  } | null;
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
  inReplyTo: tweet.inReplyTo
    ? {
        id: tweet.inReplyTo.id,
        username: tweet.inReplyTo.author.username,
      }
    : null,
});

interface SearchFilters {
  from?: string;
  to?: string;
  hashtag?: string;
  hasMedia?: boolean;
  hasImages?: boolean;
  hasVideos?: boolean;
  minLikes?: number;
  minRetweets?: number;
  since?: Date;
  until?: Date;
}

function parseSearchQuery(query: string): { text: string; filters: SearchFilters } {
  const filters: SearchFilters = {};
  let text = query;

  // Parse from:user
  const fromMatch = text.match(/from:(\w+)/);
  if (fromMatch) {
    filters.from = fromMatch[1];
    text = text.replace(fromMatch[0], "").trim();
  }

  // Parse to:user
  const toMatch = text.match(/to:(\w+)/);
  if (toMatch) {
    filters.to = toMatch[1];
    text = text.replace(toMatch[0], "").trim();
  }

  // Parse hashtag
  const hashtagMatch = text.match(/#(\w+)/);
  if (hashtagMatch) {
    filters.hashtag = hashtagMatch[1];
    text = text.replace(hashtagMatch[0], "").trim();
  }

  // Parse has:media, has:images, has:videos
  if (text.includes("has:media")) {
    filters.hasMedia = true;
    text = text.replace("has:media", "").trim();
  }
  if (text.includes("has:images")) {
    filters.hasImages = true;
    text = text.replace("has:images", "").trim();
  }
  if (text.includes("has:videos")) {
    filters.hasVideos = true;
    text = text.replace("has:videos", "").trim();
  }

  // Parse min_faves:n
  const likesMatch = text.match(/min_faves:(\d+)/);
  if (likesMatch) {
    filters.minLikes = parseInt(likesMatch[1], 10);
    text = text.replace(likesMatch[0], "").trim();
  }

  // Parse min_retweets:n
  const retweetsMatch = text.match(/min_retweets:(\d+)/);
  if (retweetsMatch) {
    filters.minRetweets = parseInt(retweetsMatch[1], 10);
    text = text.replace(retweetsMatch[0], "").trim();
  }

  // Parse since:date
  const sinceMatch = text.match(/since:(\d{4}-\d{2}-\d{2})/);
  if (sinceMatch) {
    filters.since = new Date(sinceMatch[1]);
    text = text.replace(sinceMatch[0], "").trim();
  }

  // Parse until:date
  const untilMatch = text.match(/until:(\d{4}-\d{2}-\d{2})/);
  if (untilMatch) {
    filters.until = new Date(untilMatch[1]);
    text = text.replace(untilMatch[0], "").trim();
  }

  return { text, filters };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id || null;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const type = searchParams.get("type") || "top"; // top, latest, people, media
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!q.trim()) {
      return NextResponse.json({
        tweets: [],
        users: [],
        nextCursor: null,
      });
    }

    const { text, filters } = parseSearchQuery(q);

    // Handle people search separately
    if (type === "people") {
      const users = await db.user.findMany({
        where: {
          OR: [
            { username: { contains: text, mode: "insensitive" } },
            { displayName: { contains: text, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          verified: true,
          bio: true,
          _count: {
            select: {
              followers: true,
            },
          },
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
      });

      let nextCursor: string | null = null;
      if (users.length > limit) {
        const nextItem = users.pop();
        nextCursor = nextItem!.id;
      }

      // Check follow status
      let usersWithFollowStatus = users.map((user) => ({
        ...user,
        isFollowing: false,
      }));

      if (userId) {
        const follows = await db.follow.findMany({
          where: {
            followerId: userId,
            followingId: { in: users.map((u) => u.id) },
          },
          select: { followingId: true },
        });
        const followingIds = new Set(follows.map((f) => f.followingId));

        usersWithFollowStatus = users.map((user) => ({
          ...user,
          isFollowing: followingIds.has(user.id),
        }));
      }

      return NextResponse.json({
        users: usersWithFollowStatus,
        tweets: [],
        nextCursor,
      });
    }

    // Build tweet search query
    const tweetWhereClause: {
      deletedAt: null;
      OR?: Array<{
        content?: { contains: string; mode: "insensitive" };
        author?: { username: { equals: string; mode: "insensitive" } };
        hashtags?: { some: { hashtag: { name: { equals: string; mode: "insensitive" } } } };
      }>;
      authorId?: string;
      inReplyToId?: null;
      hasMedia?: boolean;
      createdAt?: { gte?: Date; lte?: Date };
    } = {
      deletedAt: null,
    };

    // Add text search
    if (text || filters.hashtag) {
      const orConditions: Array<{
        content?: { contains: string; mode: "insensitive" };
        author?: { username: { equals: string; mode: "insensitive" } };
        hashtags?: { some: { hashtag: { name: { equals: string; mode: "insensitive" } } } };
      }> = [];

      if (text) {
        orConditions.push({ content: { contains: text, mode: "insensitive" } });
      }

      if (filters.hashtag) {
        orConditions.push({
          hashtags: {
            some: {
              hashtag: { name: { equals: filters.hashtag, mode: "insensitive" } },
            },
          },
        });
      }

      if (orConditions.length > 0) {
        tweetWhereClause.OR = orConditions;
      }
    }

    // Apply filters
    if (filters.from) {
      const user = await db.user.findFirst({
        where: { username: { equals: filters.from, mode: "insensitive" } },
        select: { id: true },
      });
      if (user) {
        tweetWhereClause.authorId = user.id;
      }
    }

    if (filters.to) {
      // Search for replies to a specific user
      const user = await db.user.findFirst({
        where: { username: { equals: filters.to, mode: "insensitive" } },
        select: { id: true },
      });
      if (user) {
        // Find tweets that are replies to this user
        const replyTweets = await db.tweet.findMany({
          where: {
            deletedAt: null,
            inReplyTo: { authorId: user.id },
          },
          select: { id: true },
        });
        // This would need more complex handling
      }
    }

    if (type === "media" || filters.hasMedia) {
      tweetWhereClause.hasMedia = true;
    }

    if (filters.hasImages) {
      tweetWhereClause.hasMedia = true;
    }

    if (filters.since || filters.until) {
      tweetWhereClause.createdAt = {};
      if (filters.since) {
        tweetWhereClause.createdAt.gte = filters.since;
      }
      if (filters.until) {
        tweetWhereClause.createdAt.lte = filters.until;
      }
    }

    // Build order by
    let orderBy: Record<string, "desc" | "asc">[] = [{ createdAt: "desc" }];
    if (type === "top") {
      // For "top", we'd ideally order by engagement score
      // For simplicity, we'll use recent tweets
      orderBy = [{ createdAt: "desc" }];
    }

    // Get tweets
    const tweets = await db.tweet.findMany({
      where: tweetWhereClause,
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
        inReplyTo: {
          select: {
            id: true,
            author: {
              select: {
                id: true,
                username: true,
              },
            },
          },
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

    // Filter by minLikes and minRetweets (post-query filter since Prisma doesn't support on where)
    let filteredTweets = tweets;
    if (filters.minLikes || filters.minRetweets) {
      filteredTweets = tweets.filter((tweet) => {
        if (filters.minLikes && tweet._count.likes < filters.minLikes) {
          return false;
        }
        if (filters.minRetweets && tweet._count.retweetRecords < filters.minRetweets) {
          return false;
        }
        return true;
      });
    }

    let nextCursor: string | null = null;
    if (filteredTweets.length > limit) {
      const nextItem = filteredTweets.pop();
      nextCursor = nextItem!.id;
    }

    const formattedTweets = filteredTweets.map((t) => formatTweet(t, userId));

    return NextResponse.json({
      tweets: formattedTweets,
      users: [],
      nextCursor,
      query: q,
      filters,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
