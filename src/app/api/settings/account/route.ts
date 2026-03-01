import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

// GET /api/settings/account - Get account settings
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        settings: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      phone: user.settings?.phone || null,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Error fetching account settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/account - Update account settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, email, phone, currentPassword, newPassword, deactivate } = body;

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle account deactivation
    if (deactivate) {
      // Verify password before deactivation
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Password required for deactivation" },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 400 }
        );
      }

      // Delete user (cascade will handle related data)
      await db.user.delete({
        where: { id: user.id },
      });

      return NextResponse.json({ success: true, deactivated: true });
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password required" },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Invalid current password" },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    // Handle username change
    if (username && username !== user.username) {
      const existingUsername = await db.user.findUnique({
        where: { username },
      });

      if (existingUsername) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: { username },
      });
    }

    // Handle email change
    if (email && email !== user.email) {
      const existingEmail = await db.user.findUnique({
        where: { email },
      });

      if (existingEmail) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }

      await db.user.update({
        where: { id: user.id },
        data: { email },
      });
    }

    // Handle phone change
    if (phone !== undefined) {
      await db.userSettings.upsert({
        where: { userId: user.id },
        update: { phone: phone || null },
        create: {
          userId: user.id,
          phone: phone || null,
        },
      });
    }

    // Fetch updated user
    const updatedUser = await db.user.findUnique({
      where: { id: user.id },
      include: { settings: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        username: updatedUser?.username,
        displayName: updatedUser?.displayName,
        phone: updatedUser?.settings?.phone || null,
      },
    });
  } catch (error) {
    console.error("Error updating account settings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
