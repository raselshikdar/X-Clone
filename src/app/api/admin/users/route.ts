import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/admin/users - Get all users with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || (user.role !== "admin" && user.role !== "moderator")) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const verified = searchParams.get("verified");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const cursor = searchParams.get("cursor");

    const users = await db.user.findMany({
      where: {
        ...(search && {
          OR: [
            { username: { contains: search, mode: "insensitive" } },
            { displayName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(role && { role }),
        ...(verified === "true" && { verified: true }),
        ...(verified === "false" && { verified: false }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        verified: true,
        role: true,
        isPrivate: true,
        createdAt: true,
        _count: { select: { tweets: true, followers: true, following: true } },
        suspensions: { where: { isActive: true }, take: 1 },
      },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: "desc" },
    });

    let nextCursor: string | null = null;
    if (users.length > limit) {
      const nextItem = users.pop();
      nextCursor = nextItem!.id;
    }

    return NextResponse.json({ users, nextCursor });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json({ error: "Failed to get users" }, { status: 500 });
  }
}
