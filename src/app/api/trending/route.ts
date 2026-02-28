import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface TrendingItem {
  id: string;
  hashtag: string;
  category: string;
  tweetCount: number;
  formattedCount: string;
}

function formatTweetCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return count.toString();
}

const categories = [
  "Technology",
  "Sports",
  "Entertainment",
  "Politics",
  "Gaming",
  "Music",
  "News",
  "Business",
  "Science",
  "Health",
  "Trending",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") || "worldwide";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 20);

    // Get trending hashtags from the database
    // First, try to get from TrendingTopic table
    const trendingTopics = await db.trendingTopic.findMany({
      where: location !== "worldwide" ? { location } : {},
      include: {
        hashtag: {
          select: {
            id: true,
            name: true,
            tweetCount: true,
          },
        },
      },
      orderBy: [
        { rank: "asc" },
        { promotedAt: "desc" },
      ],
      take: limit,
    });

    let trends: TrendingItem[] = [];

    if (trendingTopics.length > 0) {
      // Use TrendingTopic data
      trends = trendingTopics.map((topic, index) => ({
        id: topic.id,
        hashtag: topic.hashtag.name,
        category: categories[index % categories.length] + " · Trending",
        tweetCount: topic.tweetVolume || topic.hashtag.tweetCount,
        formattedCount: formatTweetCount(topic.tweetVolume || topic.hashtag.tweetCount) + " posts",
      }));
    } else {
      // Fallback: Get hashtags with most tweets in the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const popularHashtags = await db.hashtag.findMany({
        where: {
          OR: [
            { trendingAt: { gte: oneDayAgo } },
            { tweetCount: { gte: 10 } },
          ],
        },
        orderBy: [
          { tweetCount: "desc" },
          { trendingAt: "desc" },
        ],
        take: limit,
      });

      trends = popularHashtags.map((hashtag, index) => ({
        id: hashtag.id,
        hashtag: hashtag.name.startsWith("#") ? hashtag.name : `#${hashtag.name}`,
        category: categories[index % categories.length] + " · Trending",
        tweetCount: hashtag.tweetCount,
        formattedCount: formatTweetCount(hashtag.tweetCount) + " posts",
      }));
    }

    // If still no trends, create some sample ones based on actual tweet content
    if (trends.length === 0) {
      const recentTweets = await db.tweet.findMany({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        include: {
          hashtags: {
            include: {
              hashtag: true,
            },
          },
        },
        take: 100,
      });

      // Extract hashtags from recent tweets
      const hashtagCounts = new Map<string, number>();
      recentTweets.forEach((tweet) => {
        tweet.hashtags.forEach((h) => {
          const name = h.hashtag.name;
          hashtagCounts.set(name, (hashtagCounts.get(name) || 0) + 1);
        });
      });

      // Sort by count and take top
      const sortedHashtags = Array.from(hashtagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      trends = sortedHashtags.map(([name, count], index) => ({
        id: `sample-${index}`,
        hashtag: name.startsWith("#") ? name : `#${name}`,
        category: categories[index % categories.length] + " · Trending",
        tweetCount: count,
        formattedCount: formatTweetCount(count) + " posts",
      }));
    }

    return NextResponse.json({
      trends,
      location,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trending error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending topics" },
      { status: 500 }
    );
  }
}
