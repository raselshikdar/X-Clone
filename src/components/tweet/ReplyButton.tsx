"use client"

import * as React from "react"
import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserAvatar } from "@/components/common/Avatar"
import { toast } from "@/hooks/use-toast"
import { useInteractionStore } from "@/stores/interactionStore"

interface ReplyButtonProps {
  tweetId: string
  initialRepliesCount?: number
  onReply?: (reply: unknown) => void
  showCount?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  tweetContent?: string
  tweetAuthor?: {
    name: string
    username: string
    avatar: string | null
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M"
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K"
  }
  return num.toString()
}

export function ReplyButton({
  tweetId,
  initialRepliesCount = 0,
  onReply,
  showCount = true,
  size = "md",
  className,
  tweetContent,
  tweetAuthor,
}: ReplyButtonProps) {
  const [showReplyDialog, setShowReplyDialog] = React.useState(false)
  const [replyText, setReplyText] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  
  const { 
    getInteraction, 
    setInteraction, 
    incrementReplies 
  } = useInteractionStore()
  
  // Initialize state in store
  React.useEffect(() => {
    const existing = getInteraction(tweetId)
    if (!existing) {
      setInteraction(tweetId, {
        repliesCount: initialRepliesCount,
      })
    }
  }, [tweetId, initialRepliesCount])
  
  const interaction = getInteraction(tweetId)
  const repliesCount = interaction?.repliesCount ?? initialRepliesCount
  
  const handleSubmitReply = async () => {
    if (isLoading || !replyText.trim()) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/tweets/${tweetId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to post reply")
      }
      
      const data = await response.json()
      
      // Update replies count
      incrementReplies(tweetId)
      
      onReply?.(data.reply)
      
      toast({
        title: "Reply posted",
        description: "Your reply has been posted.",
      })
      
      setShowReplyDialog(false)
      setReplyText("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const sizeClasses = {
    sm: "size-[14px]",
    md: "size-[18px]",
    lg: "size-[22px]",
  }
  
  const buttonSizeClasses = {
    sm: "p-1.5 -m-1.5",
    md: "p-2 -m-2",
    lg: "p-2.5 -m-2.5",
  }
  
  const textClasses = {
    sm: "text-[11px]",
    md: "text-[13px]",
    lg: "text-[15px]",
  }
  
  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setShowReplyDialog(true)
        }}
        className={cn(
          "flex items-center gap-1 group",
          "rounded-full",
          "hover:bg-twitter-blue/10",
          "text-twitter-secondary dark:text-twitter-secondary-dark",
          "hover:text-twitter-blue",
          "transition-colors duration-200",
          buttonSizeClasses[size],
          className
        )}
      >
        <MessageCircle className={cn(sizeClasses[size], "group-hover:fill-twitter-blue/10")} />
        {showCount && repliesCount > 0 && (
          <span className={cn(textClasses[size], "group-hover:text-twitter-blue")}>
            {formatNumber(repliesCount)}
          </span>
        )}
      </button>
      
      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-[500px] p-0 gap-0">
          <DialogHeader className="p-4 border-b border-twitter-border dark:border-twitter-border-dark">
            <DialogTitle className="text-center">Reply</DialogTitle>
          </DialogHeader>
          
          <div className="p-4">
            {/* Original tweet context */}
            {tweetAuthor && (
              <div className="flex gap-3 pb-4 border-b border-twitter-border dark:border-twitter-border-dark mb-4">
                <UserAvatar
                  src={tweetAuthor.avatar}
                  alt={tweetAuthor.name}
                  fallback={tweetAuthor.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[15px]">{tweetAuthor.name}</span>
                    <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px]">
                      @{tweetAuthor.username}
                    </span>
                  </div>
                  {tweetContent && (
                    <p className="text-[15px] text-twitter-secondary dark:text-twitter-secondary-dark line-clamp-3">
                      {tweetContent}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Reply textarea */}
            <div className="flex gap-3">
              <UserAvatar
                src={null}
                alt="You"
                fallback="You"
                size="md"
              />
              <Textarea
                placeholder="Post your reply"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={280}
                className="min-h-[100px] resize-none border-none focus-visible:ring-0 text-lg"
                autoFocus
              />
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-twitter-border dark:border-twitter-border-dark">
              <div className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
                {replyText.length}/280
              </div>
              <Button
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || isLoading}
                className="bg-twitter-blue hover:bg-twitter-blue/90 rounded-full px-5"
              >
                {isLoading ? "Replying..." : "Reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
