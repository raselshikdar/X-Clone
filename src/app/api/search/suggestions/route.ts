import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    if (!q.trim() || q.length < 2) {
      return NextResponse.json({
        users: [],
        hashtags: [],
        topics: [],
      });
    }

    // Search users
    const users = await db.user.findMany({
      where: {
        OR: [
          { username: { startsWith: q, mode: "insensitive" } },
          { displayName: { startsWith: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        verified: true,
      },
      take: limit,
      orderBy: { verified: "desc" },
    });

    // Search hashtags
    const hashtags = await db.hashtag.findMany({
      where: {
        name: { startsWith: q.replace(/^#/, ""), mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        tweetCount: true,
      },
      take: limit,
      orderBy: { tweetCount: "desc" },
    });

    // Build topics from hashtag names
    const topics = hashtags.slice(0, 3).map((h) => ({
      id: h.id,
      name: h.name.startsWith("#") ? h.name : `#${h.name}`,
      tweetCount: h.tweetCount,
    }));

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        username: u.username,
        name: u.displayName || u.username,
        avatar: u.avatar,
        verified: u.verified,
      })),
      hashtags: hashtags.map((h) => ({
        id: h.id,
        name: h.name.startsWith("#") ? h.name : `#${h.name}`,
        tweetCount: h.tweetCount,
      })),
      topics,
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
