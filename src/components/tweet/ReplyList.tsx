"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/common/Avatar"
import { Button } from "@/components/ui/button"
import { TweetCard } from "@/components/common/TweetCard"
import { LikeButton } from "@/components/tweet/LikeButton"
import { RetweetButton } from "@/components/tweet/RetweetButton"
import { BookmarkButton } from "@/components/tweet/BookmarkButton"
import { ReplyButton } from "@/components/tweet/ReplyButton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"

interface Reply {
  id: string
  content: string
  createdAt: Date
  views?: number
  user: {
    id: string
    name: string
    username: string
    avatar: string | null
    verified?: boolean
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
  isLiked?: boolean
  isRetweeted?: boolean
}

interface ReplyListProps {
  tweetId: string
  className?: string
  showSort?: boolean
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

export function ReplyList({
  tweetId,
  className,
  showSort = true,
}: ReplyListProps) {
  const [replies, setReplies] = React.useState<Reply[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [sortBy, setSortBy] = React.useState<"newest" | "relevance">("newest")
  
  const fetchReplies = React.useCallback(async (pageNum: number, sort: string) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/tweets/${tweetId}/replies?page=${pageNum}&limit=10&sort=${sort}`
      )
      if (!response.ok) throw new Error("Failed to fetch replies")
      
      const data = await response.json()
      
      if (pageNum === 1) {
        setReplies(data.replies)
      } else {
        setReplies((prev) => [...prev, ...data.replies])
      }
      
      setHasMore(pageNum < data.pagination.totalPages)
    } catch (error) {
      console.error("Error fetching replies:", error)
    } finally {
      setLoading(false)
    }
  }, [tweetId])
  
  React.useEffect(() => {
    setPage(1)
    fetchReplies(1, sortBy)
  }, [sortBy, fetchReplies])
  
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchReplies(nextPage, sortBy)
    }
  }
  
  const handleSortChange = (value: string) => {
    setSortBy(value as "newest" | "relevance")
  }
  
  return (
    <div className={cn("divide-y divide-twitter-border dark:divide-twitter-border-dark", className)}>
      {showSort && (
        <div className="p-4">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="relevance">Most relevant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      
      {loading && replies.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="size-6 border-2 border-twitter-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : replies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-twitter-secondary dark:text-twitter-secondary-dark">
          <p className="text-lg font-medium">No replies yet</p>
          <p className="text-sm">Be the first to reply!</p>
        </div>
      ) : (
        <>
          {replies.map((reply) => (
            <article
              key={reply.id}
              className="flex gap-3 px-4 py-3 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
            >
              {/* Avatar */}
              <Link href={`/profile/${reply.user.username}`}>
                <UserAvatar
                  src={reply.user.avatar}
                  alt={reply.user.name}
                  fallback={reply.user.name}
                  size="md"
                  className="shrink-0"
                />
              </Link>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-1 flex-wrap">
                  <Link
                    href={`/profile/${reply.user.username}`}
                    className="font-bold text-[15px] hover:underline"
                  >
                    {reply.user.name}
                  </Link>
                  {reply.user.verified && (
                    <CheckCircle2 className="size-[18px] text-twitter-blue fill-twitter-blue" />
                  )}
                  <Link
                    href={`/profile/${reply.user.username}`}
                    className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px]"
                  >
                    @{reply.user.username}
                  </Link>
                  <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px]">
                    ·
                  </span>
                  <Link
                    href={`/status/${reply.id}`}
                    className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px] hover:underline"
                  >
                    {formatRelativeTime(reply.createdAt)}
                  </Link>
                </div>
                
                {/* Content */}
                <div className="text-[15px] whitespace-pre-wrap break-words mt-0.5">
                  {reply.content}
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-between mt-3 max-w-[425px] -ml-2">
                  <ReplyButton
                    tweetId={reply.id}
                    initialRepliesCount={reply.replies}
                    size="sm"
                    tweetContent={reply.content}
                    tweetAuthor={reply.user}
                  />
                  <RetweetButton
                    tweetId={reply.id}
                    initialIsRetweeted={reply.isRetweeted}
                    initialRetweetsCount={reply.retweets}
                    size="sm"
                  />
                  <LikeButton
                    tweetId={reply.id}
                    initialIsLiked={reply.isLiked}
                    initialLikesCount={reply.likes}
                    size="sm"
                  />
                  <BookmarkButton
                    tweetId={reply.id}
                    size="sm"
                    showToast={false}
                  />
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
                {loading ? "Loading..." : "Load more replies"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
