import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { writeFile, unlink } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";

// POST /api/users/me/avatar - Upload avatar image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
      const oldPath = path.join(process.cwd(), "public", user.avatar);
      try {
        await unlink(oldPath);
      } catch {
        // Ignore error if file doesn't exist
      }
    }

    // Write new file
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Update user avatar in database
    const avatarUrl = `/uploads/avatars/${fileName}`;
    await db.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
    });

    return NextResponse.json({
      success: true,
      avatar: avatarUrl,
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/me/avatar - Remove avatar
export async function DELETE() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete avatar file if exists
    if (user.avatar && user.avatar.startsWith("/uploads/avatars/")) {
      const filePath = path.join(process.cwd(), "public", user.avatar);
      try {
        await unlink(filePath);
      } catch {
        // Ignore error if file doesn't exist
      }
    }

    // Update user in database
    await db.user.update({
      where: { id: user.id },
      data: { avatar: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing avatar:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
