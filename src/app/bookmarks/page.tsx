"use client"

import * as React from "react"
import Link from "next/link"
import { Bookmark, ArrowLeft, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/common/Avatar"
import { LikeButton } from "@/components/tweet/LikeButton"
import { RetweetButton } from "@/components/tweet/RetweetButton"
import { BookmarkButton } from "@/components/tweet/BookmarkButton"
import { ReplyButton } from "@/components/tweet/ReplyButton"
import { ShareButton } from "@/components/tweet/ShareButton"
import { ViewCount } from "@/components/tweet/ViewCount"
import { CheckCircle2 } from "lucide-react"

interface BookmarkedTweet {
  id: string
  content: string
  createdAt: Date
  views: number
  bookmarkedAt: Date
  user: {
    id: string
    name: string
    username: string
    avatar: string | null
    verified: boolean
  }
  media?: Array<{
    id: string
    type: string
    url: string
    thumbnail?: string
  }>
  likes: number
  retweets: number
  replies: number
  isLiked: boolean
  isRetweeted: boolean
  isBookmarked: boolean
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return "now"
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}d`

  const d = new Date(date)
  return `${d.getMonth() + 1} ${d.getDate()}`
}

function parseContent(content: string) {
  const parts = content.split(/(\s+)/)
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <Link
          key={index}
          href={`/profile/${part.slice(1)}`}
          className="text-twitter-blue hover:underline"
        >
          {part}
        </Link>
      )
    }
    if (part.startsWith("#")) {
      return (
        <Link
          key={index}
          href={`/search?q=${encodeURIComponent(part)}`}
          className="text-twitter-blue hover:underline"
        >
          {part}
        </Link>
      )
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      try {
        const url = new URL(part)
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-twitter-blue hover:underline"
          >
            {url.hostname}
          </a>
        )
      } catch {
        return part
      }
    }
    return part
  })
}

export default function BookmarksPage() {
  const [tweets, setTweets] = React.useState<BookmarkedTweet[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  
  const fetchBookmarks = React.useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/bookmarks?page=${pageNum}&limit=20`)
      if (!response.ok) throw new Error("Failed to fetch bookmarks")
      
      const data = await response.json()
      
      if (pageNum === 1) {
        setTweets(data.tweets)
      } else {
        setTweets((prev) => [...prev, ...data.tweets])
      }
      
      setHasMore(pageNum < data.pagination.totalPages)
    } catch (error) {
      console.error("Error fetching bookmarks:", error)
    } finally {
      setLoading(false)
    }
  }, [])
  
  React.useEffect(() => {
    fetchBookmarks(1)
  }, [fetchBookmarks])
  
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchBookmarks(nextPage)
    }
  }
  
  const handleRemoveBookmark = (tweetId: string) => {
    setTweets((prev) => prev.filter((t) => t.id !== tweetId))
  }
  
  return (
    <div className="min-h-screen border-x border-twitter-border dark:border-twitter-border-dark">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-6 px-4 py-2">
          <Link
            href="/"
            className="p-2 -m-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Bookmarks</h1>
            <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
              @{typeof window !== "undefined" ? "username" : "username"}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="size-5" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      {loading && tweets.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-2 border-twitter-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tweets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="size-16 rounded-full bg-twitter-hover dark:bg-twitter-hover-dark flex items-center justify-center mb-4">
            <Bookmark className="size-8 text-twitter-blue" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No bookmarks yet</h2>
          <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-center max-w-sm">
            Save posts for later by tapping the bookmark icon on any post. They&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
          {tweets.map((tweet) => (
            <article
              key={tweet.id}
              className="flex gap-3 px-4 py-3 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
            >
              {/* Avatar */}
              <Link href={`/profile/${tweet.user.username}`}>
                <UserAvatar
                  src={tweet.user.avatar}
                  alt={tweet.user.name}
                  fallback={tweet.user.name}
                  size="md"
                  className="shrink-0"
                />
              </Link>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-1 flex-wrap">
                  <Link
                    href={`/profile/${tweet.user.username}`}
                    className="font-bold text-[15px] hover:underline"
                  >
                    {tweet.user.name}
                  </Link>
                  {tweet.user.verified && (
                    <CheckCircle2 className="size-[18px] text-twitter-blue fill-twitter-blue" />
                  )}
                  <Link
                    href={`/profile/${tweet.user.username}`}
                    className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px]"
                  >
                    @{tweet.user.username}
                  </Link>
                  <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px]">
                    ·
                  </span>
                  <Link
                    href={`/status/${tweet.id}`}
                    className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px] hover:underline"
                  >
                    {formatRelativeTime(tweet.createdAt)}
                  </Link>
                </div>
                
                {/* Content */}
                <div className="text-[15px] whitespace-pre-wrap break-words mt-0.5">
                  {tweet.content && parseContent(tweet.content)}
                </div>
                
                {/* Media */}
                {tweet.media && tweet.media.length > 0 && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-twitter-border dark:border-twitter-border-dark">
                    {tweet.media[0].type === "image" ? (
                      <img
                        src={tweet.media[0].url}
                        alt=""
                        className="w-full max-h-[500px] object-cover"
                      />
                    ) : (
                      <video
                        src={tweet.media[0].url}
                        poster={tweet.media[0].thumbnail}
                        className="w-full max-h-[500px]"
                        controls
                      />
                    )}
                  </div>
                )}
                
                {/* Actions */}
                <div className="flex items-center justify-between mt-3 max-w-[425px] -ml-2">
                  <ReplyButton
                    tweetId={tweet.id}
                    initialRepliesCount={tweet.replies}
                    size="sm"
                    tweetContent={tweet.content || ""}
                    tweetAuthor={tweet.user}
                  />
                  <RetweetButton
                    tweetId={tweet.id}
                    initialIsRetweeted={tweet.isRetweeted}
                    initialRetweetsCount={tweet.retweets}
                    size="sm"
                  />
                  <LikeButton
                    tweetId={tweet.id}
                    initialIsLiked={tweet.isLiked}
                    initialLikesCount={tweet.likes}
                    size="sm"
                  />
                  <ViewCount
                    tweetId={tweet.id}
                    initialViewsCount={tweet.views}
                    size="sm"
                  />
                  <div className="flex items-center gap-0">
                    <BookmarkButton
                      tweetId={tweet.id}
                      initialIsBookmarked={true}
                      onBookmarkChange={(isBookmarked) => {
                        if (!isBookmarked) {
                          handleRemoveBookmark(tweet.id)
                        }
                      }}
                      size="sm"
                      showToast={true}
                    />
                    <ShareButton
                      tweetId={tweet.id}
                      authorUsername={tweet.user.username}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
          
          {hasMore && (
            <div className="p-4 text-center">
              <Button
                variant="ghost"
                onClick={loadMore}
                disabled={loading}
                className="text-twitter-blue"
              >
                {loading ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
