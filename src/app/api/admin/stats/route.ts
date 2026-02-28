import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/admin/stats - Get platform statistics
export async function GET() {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin/moderator role
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Get stats
    const [
      totalUsers,
      totalTweets,
      totalCommunities,
      totalReports,
      pendingReports,
      newUsersToday,
      tweetsToday,
      activeUsersToday,
      verifiedUsers,
      suspendedUsers,
    ] = await Promise.all([
      db.user.count(),
      db.tweet.count({ where: { deletedAt: null } }),
      db.community.count(),
      db.report.count(),
      db.report.count({ where: { status: "pending" } }),
      db.user.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      db.tweet.count({
        where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, deletedAt: null },
      }),
      db.user.count({
        where: { sessions: { some: { lastActive: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } } },
      }),
      db.user.count({ where: { verified: true } }),
      db.suspension.count({ where: { isActive: true } }),
    ]);

    // Get user growth (last 7 days)
    const userGrowth = await db.user.groupBy({
      by: ["createdAt"],
      _count: { id: true },
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { createdAt: "asc" },
    });

    // Get report types breakdown
    const reportsByType = await db.report.groupBy({
      by: ["type"],
      _count: { id: true },
      where: { status: "pending" },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        totalTweets,
        totalCommunities,
        totalReports,
        pendingReports,
        newUsersToday,
        tweetsToday,
        activeUsersToday,
        verifiedUsers,
        suspendedUsers,
      },
      charts: {
        userGrowth: userGrowth.map((g) => ({
          date: g.createdAt.toISOString().split("T")[0],
          count: g._count.id,
        })),
        reportsByType: reportsByType.map((r) => ({
          type: r.type,
          count: r._count.id,
        })),
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
