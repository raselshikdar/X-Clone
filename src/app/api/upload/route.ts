import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];
const ALLOWED_GIF_TYPES = ["image/gif"];

// Max file sizes (in bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 512 * 1024 * 1024; // 512MB
const MAX_GIF_SIZE = 15 * 1024 * 1024; // 15MB

// POST /api/upload - Upload media
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Max 4 files per upload
    if (files.length > 4) {
      return NextResponse.json(
        { error: "Maximum 4 files allowed per upload" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", session.user.id);

    // Ensure upload directory exists
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uploadedFiles: {
      id: string;
      type: "image" | "video" | "gif";
      url: string;
      thumbnail?: string;
      width?: number;
      height?: number;
    }[] = [];

    for (const file of files) {
      // Validate file type
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);
      const isGif = ALLOWED_GIF_TYPES.includes(file.type);

      if (!isImage && !isVideo && !isGif) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}` },
          { status: 400 }
        );
      }

      // Validate file size
      const maxSize = isVideo ? MAX_VIDEO_SIZE : isGif ? MAX_GIF_SIZE : MAX_IMAGE_SIZE;
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File too large. Max size: ${maxSize / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const ext = file.name.split(".").pop() || "bin";
      const filename = `${timestamp}-${randomStr}.${ext}`;
      const filepath = path.join(uploadDir, filename);

      // Write file
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Determine media type
      let mediaType: "image" | "video" | "gif" = "image";
      if (isVideo) {
        mediaType = "video";
      } else if (isGif) {
        mediaType = "gif";
      }

      const fileId = `${session.user.id}-${timestamp}-${randomStr}`;

      uploadedFiles.push({
        id: fileId,
        type: mediaType,
        url: `/uploads/${session.user.id}/${filename}`,
        // Thumbnail would be generated for videos in production
        thumbnail: isVideo ? `/uploads/${session.user.id}/${filename}` : undefined,
      });
    }

    return NextResponse.json({
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 });
  }
}
