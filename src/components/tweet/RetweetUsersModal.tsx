"use client"

import * as React from "react"
import Link from "next/link"
import { UserAvatar } from "@/components/common/Avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2 } from "lucide-react"

interface RetweetUser {
  id: string
  username: string
  displayName: string
  avatar: string | null
  verified: boolean
  bio?: string | null
  retweetedAt: Date
  quoteText?: string | null
}

interface RetweetUsersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tweetId: string
}

export function RetweetUsersModal({
  open,
  onOpenChange,
  tweetId,
}: RetweetUsersModalProps) {
  const [users, setUsers] = React.useState<RetweetUser[]>([])
  const [loading, setLoading] = React.useState(true)
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  
  const fetchUsers = React.useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/tweets/${tweetId}/retweet?page=${pageNum}&limit=20`
      )
      if (!response.ok) throw new Error("Failed to fetch users")
      
      const data = await response.json()
      
      if (pageNum === 1) {
        setUsers(data.users)
      } else {
        setUsers((prev) => [...prev, ...data.users])
      }
      
      setHasMore(pageNum < data.pagination.totalPages)
    } catch (error) {
      console.error("Error fetching retweet users:", error)
    } finally {
      setLoading(false)
    }
  }, [tweetId])
  
  React.useEffect(() => {
    if (open) {
      setPage(1)
      fetchUsers(1)
    }
  }, [open, fetchUsers])
  
  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchUsers(nextPage)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 gap-0">
        <DialogHeader className="p-4 border-b border-twitter-border dark:border-twitter-border-dark">
          <DialogTitle>Reposted by</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          {loading && users.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="size-6 border-2 border-twitter-blue border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-twitter-secondary dark:text-twitter-secondary-dark">
              <p>No reposts yet</p>
            </div>
          ) : (
            <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start gap-3 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
                >
                  <Link href={`/profile/${user.username}`}>
                    <UserAvatar
                      src={user.avatar}
                      alt={user.displayName}
                      fallback={user.displayName}
                      size="md"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/profile/${user.username}`}
                        className="font-bold text-[15px] hover:underline truncate"
                      >
                        {user.displayName}
                      </Link>
                      {user.verified && (
                        <CheckCircle2 className="size-[16px] text-twitter-blue fill-twitter-blue shrink-0" />
                      )}
                    </div>
                    <Link
                      href={`/profile/${user.username}`}
                      className="text-twitter-secondary dark:text-twitter-secondary-dark text-[13px] hover:underline"
                    >
                      @{user.username}
                    </Link>
                    {user.quoteText && (
                      <p className="mt-1 text-[15px]">{user.quoteText}</p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full px-4"
                  >
                    Follow
                  </Button>
                </div>
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
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
