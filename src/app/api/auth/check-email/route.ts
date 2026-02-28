import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        available: false,
        reason: "Invalid email format",
      });
    }

    // Check if email exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return NextResponse.json({
      available: !existingUser,
      reason: existingUser ? "Email is already registered" : undefined,
    });
  } catch (error) {
    console.error("Check email error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
