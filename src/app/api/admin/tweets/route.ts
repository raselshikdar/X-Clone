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
    const authorId = searchParams.get('authorId') || '';
    const communityId = searchParams.get('communityId') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const hasMedia = searchParams.get('hasMedia') || '';
    const sensitiveContent = searchParams.get('sensitiveContent') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {
      deletedAt: null,
    };
    
    if (search) {
      where.content = { contains: search };
    }
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    if (communityId) {
      where.communityId = communityId;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.createdAt as Record<string, Date>).lte = new Date(dateTo);
      }
    }
    
    if (hasMedia === 'true') {
      where.hasMedia = true;
    }
    
    if (sensitiveContent === 'true') {
      where.sensitiveContent = true;
    }

    // Get tweets with pagination
    const [tweets, total] = await Promise.all([
      db.tweet.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          views: true,
          hasMedia: true,
          sensitiveContent: true,
          author: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              role: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              likes: true,
              retweetRecords: true,
              replies: true,
            },
          },
        },
      }),
      db.tweet.count({ where }),
    ]);

    return NextResponse.json({
      tweets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching admin tweets:', error);
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
    const tweetId = searchParams.get('id');

    if (!tweetId) {
      return NextResponse.json(
        { error: 'Tweet ID is required' },
        { status: 400 }
      );
    }

    // Check if tweet exists
    const tweet = await db.tweet.findUnique({
      where: { id: tweetId },
      select: { id: true, authorId: true, content: true },
    });

    if (!tweet) {
      return NextResponse.json({ error: 'Tweet not found' }, { status: 404 });
    }

    // Soft delete the tweet
    await db.tweet.update({
      where: { id: tweetId },
      data: { deletedAt: new Date() },
    });

    // Create audit log
    await createAuditLog({
      action: 'tweet.deleted',
      targetType: 'tweet',
      targetId: tweetId,
      actorId: admin.id,
      details: {
        authorId: tweet.authorId,
        contentPreview: tweet.content?.slice(0, 100),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tweet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
