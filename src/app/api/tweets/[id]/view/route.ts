import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Record view (for analytics)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tweetId } = await params

    // Check if tweet exists
    const tweet = await db.tweet.findUnique({
      where: { id: tweetId, deletedAt: null },
      select: { id: true },
    })

    if (!tweet) {
      return NextResponse.json({ error: 'Tweet not found' }, { status: 404 })
    }

    // Increment view count atomically
    const updatedTweet = await db.tweet.update({
      where: { id: tweetId },
      data: {
        views: {
          increment: 1,
        },
      },
      select: {
        views: true,
      },
    })

    return NextResponse.json({ 
      success: true, 
      views: updatedTweet.views,
    })
  } catch (error) {
    console.error('Error recording view:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get view count for a tweet
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: tweetId } = await params

    const tweet = await db.tweet.findUnique({
      where: { id: tweetId, deletedAt: null },
      select: {
        views: true,
      },
    })

    if (!tweet) {
      return NextResponse.json({ error: 'Tweet not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      views: tweet.views,
    })
  } catch (error) {
    console.error('Error fetching views:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
