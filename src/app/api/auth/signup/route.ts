import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";
import { z } from "zod";

const signupSchema = z.object({
  displayName: z.string().min(1, "Name is required").max(50, "Name is too long"),
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(15, "Username must be at most 15 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  birthDate: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = signupSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { displayName, email, username, password, birthDate } = validationResult.data;

    // Check for existing email
    const existingEmail = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email is already registered" },
        { status: 400 }
      );
    }

    // Check for existing username
    const existingUsername = await db.user.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        displayName,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        username: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
