import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json({
        available: false,
        reason: "Username can only contain letters, numbers, and underscores",
      });
    }

    if (username.length < 3) {
      return NextResponse.json({
        available: false,
        reason: "Username must be at least 3 characters",
      });
    }

    if (username.length > 15) {
      return NextResponse.json({
        available: false,
        reason: "Username must be at most 15 characters",
      });
    }

    // Check if username exists
    const existingUser = await db.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    return NextResponse.json({
      available: !existingUser,
      reason: existingUser ? "Username is already taken" : undefined,
    });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
