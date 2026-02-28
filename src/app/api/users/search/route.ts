import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// GET /api/users/search - Search for users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    const searchQuery = query.trim().toLowerCase();

    // Search by username or displayName
    const users = await db.user.findMany({
      where: {
        AND: [
          { id: { not: userId } }, // Exclude current user
          {
            OR: [
              { username: { contains: searchQuery } },
              { displayName: { contains: searchQuery } },
            ],
          },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        verified: true,
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
