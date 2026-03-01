import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin, createAuditLog, isUserSuspended, requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();

    const { id } = await params;

    const userDetails = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        banner: true,
        bio: true,
        location: true,
        website: true,
        birthDate: true,
        verified: true,
        verifiedAt: true,
        verificationStatus: true,
        isPrivate: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            tweets: { where: { deletedAt: null } },
            followers: true,
            following: true,
            likes: true,
            bookmarks: true,
            lists: true,
            ownedCommunities: true,
            communityMembers: true,
            reportsMade: true,
            reports: true,
          },
        },
        suspensions: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            suspendedByUser: {
              select: { id: true, username: true, displayName: true },
            },
          },
        },
      },
    });

    if (!userDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get recent tweets
    const recentTweets = await db.tweet.findMany({
      where: { authorId: id, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        content: true,
        createdAt: true,
        _count: {
          select: { likes: true, retweetRecords: true, replies: true },
        },
      },
    });

    // Get reports against this user
    const reports = await db.report.findMany({
      where: { reportedId: id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        reason: true,
        status: true,
        createdAt: true,
        reporter: {
          select: { id: true, username: true, displayName: true },
        },
      },
    });

    return NextResponse.json({
      ...userDetails,
      isSuspended: await isUserSuspended(id),
      recentTweets,
      reports,
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
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
    const admin = await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const { role, verified, isPrivate } = body;

    const updateData: Record<string, unknown> = {};
    
    if (role !== undefined) {
      if (!['user', 'moderator', 'admin'].includes(role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updateData.role = role;
    }
    
    if (verified !== undefined) {
      updateData.verified = verified;
      if (verified) {
        updateData.verifiedAt = new Date();
      }
    }
    
    if (isPrivate !== undefined) {
      updateData.isPrivate = isPrivate;
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    // Create audit log
    await createAuditLog({
      action: 'user.updated',
      targetType: 'user',
      targetId: id,
      actorId: admin.id,
      details: { changes: updateData },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;

    // Don't allow deleting yourself
    if (id === admin.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userToDelete = await db.user.findUnique({
      where: { id },
      select: { username: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete user (cascade will handle related data)
    await db.user.delete({
      where: { id },
    });

    // Create audit log
    await createAuditLog({
      action: 'user.deleted',
      targetType: 'user',
      targetId: id,
      actorId: admin.id,
      details: { username: userToDelete.username },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
