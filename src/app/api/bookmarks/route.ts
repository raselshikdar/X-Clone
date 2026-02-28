import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { db } from '@/lib/db'

// GET - Get user's bookmarked tweets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const bookmarks = await db.bookmark.findMany({
      where: { userId: session.user.id },
      include: {
        tweet: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                verified: true,
              },
            },
            media: {
              select: {
                id: true,
                type: true,
                url: true,
                thumbnailUrl: true,
              },
            },
            likes: {
              where: { userId: session.user.id },
              select: { id: true },
            },
            retweets: {
              where: { userId: session.user.id },
              select: { id: true },
            },
            _count: {
              select: {
                likes: true,
                retweets: true,
                replies: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    const total = await db.bookmark.count({ 
      where: { userId: session.user.id } 
    })

    const tweets = bookmarks.map((bookmark) => ({
      id: bookmark.tweet.id,
      content: bookmark.tweet.content,
      createdAt: bookmark.tweet.createdAt,
      views: bookmark.tweet.views,
      user: {
        id: bookmark.tweet.author.id,
        name: bookmark.tweet.author.displayName,
        username: bookmark.tweet.author.username,
        avatar: bookmark.tweet.author.avatar,
        verified: bookmark.tweet.author.verified,
      },
      media: bookmark.tweet.media.map((m) => ({
        id: m.id,
        type: m.type,
        url: m.url,
        thumbnail: m.thumbnailUrl,
      })),
      likes: bookmark.tweet._count.likes,
      retweets: bookmark.tweet._count.retweets,
      replies: bookmark.tweet._count.replies,
      isLiked: bookmark.tweet.likes.length > 0,
      isRetweeted: bookmark.tweet.retweets.length > 0,
      isBookmarked: true,
      bookmarkedAt: bookmark.createdAt,
    }))

    return NextResponse.json({
      tweets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
