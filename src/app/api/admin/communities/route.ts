import { NextRequest, NextResponse } from 'next/server';
import { checkModerator, createAuditLog } from '@/lib/admin';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await checkModerator();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get communities with pagination
    const [communities, total] = await Promise.all([
      db.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        select: {
          id: true,
          name: true,
          description: true,
          banner: true,
          icon: true,
          isPrivate: true,
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
          _count: {
            select: {
              members: true,
              tweets: { where: { deletedAt: null } },
            },
          },
        },
      }),
      db.community.count({ where }),
    ]);

    return NextResponse.json({
      communities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin communities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkModerator();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get('id');

    if (!communityId) {
      return NextResponse.json(
        { error: 'Community ID is required' },
        { status: 400 }
      );
    }

    // Check if community exists
    const community = await db.community.findUnique({
      where: { id: communityId },
      select: { id: true, name: true },
    });

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    }

    // Delete community
    await db.community.delete({
      where: { id: communityId },
    });

    // Create audit log
    await createAuditLog({
      action: 'community.deleted',
      targetType: 'community',
      targetId: communityId,
      actorId: admin.id,
      details: { name: community.name },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting community:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
