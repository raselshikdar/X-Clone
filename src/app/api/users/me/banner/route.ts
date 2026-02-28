import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { writeFile, unlink } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import path from "path";

// POST /api/users/me/banner - Upload banner image
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
    const file = formData.get("banner") as File | null;

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
    const fileName = `${user.id}-${Date.now()}-banner.${fileExtension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");

    // Ensure directory exists
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Delete old banner if exists
    if (user.banner && user.banner.startsWith("/uploads/banners/")) {
      const oldPath = path.join(process.cwd(), "public", user.banner);
      try {
        await unlink(oldPath);
      } catch {
        // Ignore error if file doesn't exist
      }
    }

    // Write new file
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Update user banner in database
    const bannerUrl = `/uploads/banners/${fileName}`;
    await db.user.update({
      where: { id: user.id },
      data: { banner: bannerUrl },
    });

    return NextResponse.json({
      success: true,
      banner: bannerUrl,
    });
  } catch (error) {
    console.error("Error uploading banner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/me/banner - Remove banner
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

    // Delete banner file if exists
    if (user.banner && user.banner.startsWith("/uploads/banners/")) {
      const filePath = path.join(process.cwd(), "public", user.banner);
      try {
        await unlink(filePath);
      } catch {
        // Ignore error if file doesn't exist
      }
    }

    // Update user in database
    await db.user.update({
      where: { id: user.id },
      data: { banner: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing banner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
