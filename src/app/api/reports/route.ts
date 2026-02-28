import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

// POST /api/reports - Create a report
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const userId = (session?.user as { id?: string })?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, reportedId, reason, description } = body;

    if (!["tweet", "user", "message", "community"].includes(type)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    if (!reportedId || !reason) {
      return NextResponse.json({ error: "Reported ID and reason required" }, { status: 400 });
    }

    // Check if already reported
    const existing = await db.report.findFirst({
      where: {
        type,
        reportedId,
        reporterId: userId,
        status: "pending",
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already reported" }, { status: 400 });
    }

    const report = await db.report.create({
      data: {
        type,
        reportedId,
        reporterId: userId,
        reason,
        description: description || null,
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json({ error: "Failed to create report" }, { status: 500 });
  }
}
