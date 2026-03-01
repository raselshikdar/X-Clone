import { NextRequest, NextResponse } from 'next/server';
import { checkModerator, createAuditLog, requireModerator } from '@/lib/admin';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await checkModerator();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const report = await db.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            email: true,
            createdAt: true,
            _count: {
              select: { reportsMade: true },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Get reported content based on type
    let reportedContent = null;
    
    if (report.type === 'user') {
      reportedContent = await db.user.findUnique({
        where: { id: report.reportedId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          createdAt: true,
          role: true,
          verified: true,
          _count: {
            select: {
              tweets: { where: { deletedAt: null } },
              followers: true,
              reports: true,
              suspensions: { where: { isActive: true } },
            },
          },
        },
      });
    } else if (report.type === 'tweet') {
      reportedContent = await db.tweet.findUnique({
        where: { id: report.reportedId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          deletedAt: true,
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              likes: true,
              retweetRecords: true,
            },
          },
        },
      });
    } else if (report.type === 'community') {
      reportedContent = await db.community.findUnique({
        where: { id: report.reportedId },
        select: {
          id: true,
          name: true,
          description: true,
          banner: true,
          memberCount: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
        },
      });
    }

    // Get other reports for the same entity
    const relatedReports = await db.report.findMany({
      where: {
        reportedId: report.reportedId,
        id: { not: id },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reason: true,
        status: true,
        createdAt: true,
        reporter: {
          select: { username: true },
        },
      },
    });

    return NextResponse.json({
      report,
      reportedContent,
      relatedReports,
    });
  } catch (error) {
    console.error('Error fetching report details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireModerator();

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const report = await db.report.findUnique({
      where: { id },
    });

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const updatedReport = await db.report.update({
      where: { id },
      data: {
        status,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      action: 'report.status_updated',
      targetType: 'report',
      targetId: id,
      actorId: admin.id,
      details: { status, previousStatus: report.status },
    });

    return NextResponse.json(updatedReport);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
