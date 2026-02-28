"use client"

import * as React from "react"
import { Repeat2, PenLine } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInteractionStore } from "@/stores/interactionStore"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface RetweetButtonProps {
  tweetId: string
  initialIsRetweeted?: boolean
  initialRetweetsCount?: number
  onRetweetChange?: (isRetweeted: boolean, retweetsCount: number) => void
  showCount?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
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

export function RetweetButton({
  tweetId,
  initialIsRetweeted = false,
  initialRetweetsCount = 0,
  onRetweetChange,
  showCount = true,
  size = "md",
  className,
}: RetweetButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [showQuoteDialog, setShowQuoteDialog] = React.useState(false)
  const [quoteText, setQuoteText] = React.useState("")
  
  const { 
    getInteraction, 
    setInteraction, 
    toggleRetweet, 
    revertRetweet 
  } = useInteractionStore()
  
  // Initialize state in store
  React.useEffect(() => {
    const existing = getInteraction(tweetId)
    if (!existing) {
      setInteraction(tweetId, {
        isRetweeted: initialIsRetweeted,
        retweetsCount: initialRetweetsCount,
      })
    }
  }, [tweetId, initialIsRetweeted, initialRetweetsCount])
  
  const interaction = getInteraction(tweetId)
  const isRetweeted = interaction?.isRetweeted ?? initialIsRetweeted
  const retweetsCount = interaction?.retweetsCount ?? initialRetweetsCount
  
  const handleRetweet = async () => {
    if (isLoading) return
    
    // Optimistic update
    const { wasRetweeted, previousState } = toggleRetweet(tweetId)
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/tweets/${tweetId}/retweet`, {
        method: wasRetweeted ? "DELETE" : "POST",
      })
      
      if (!response.ok) {
        throw new Error("Failed to update retweet")
      }
      
      const data = await response.json()
      setInteraction(tweetId, {
        isRetweeted: data.isRetweeted,
        retweetsCount: data.retweetsCount,
      })
      
      onRetweetChange?.(data.isRetweeted, data.retweetsCount)
    } catch (error) {
      // Revert on error
      revertRetweet(tweetId, previousState)
      toast({
        title: "Error",
        description: "Failed to update retweet. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleQuoteSubmit = async () => {
    if (isLoading || !quoteText.trim()) return
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/tweets/${tweetId}/retweet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteText: quoteText.trim() }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to quote tweet")
      }
      
      const data = await response.json()
      
      // Update state
      setInteraction(tweetId, {
        isRetweeted: true,
        retweetsCount: data.retweetsCount,
      })
      
      onRetweetChange?.(true, data.retweetsCount)
      
      toast({
        title: "Quote posted",
        description: "Your quote tweet has been posted.",
      })
      
      setShowQuoteDialog(false)
      setQuoteText("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post quote tweet. Please try again.",
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1 group",
              "rounded-full",
              "hover:bg-green-500/10",
              "text-twitter-secondary dark:text-twitter-secondary-dark",
              isRetweeted ? "text-green-500" : "hover:text-green-500",
              "transition-colors duration-200",
              "disabled:opacity-50",
              buttonSizeClasses[size],
              className
            )}
          >
            <Repeat2
              className={cn(
                sizeClasses[size],
                isRetweeted && "fill-green-500/10"
              )}
            />
            {showCount && retweetsCount > 0 && (
              <span
                className={cn(
                  textClasses[size],
                  isRetweeted ? "text-green-500" : "group-hover:text-green-500"
                )}
              >
                {formatNumber(retweetsCount)}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
          {isRetweeted ? (
            <DropdownMenuItem
              onClick={handleRetweet}
              className="gap-3 text-red-500 focus:text-red-500"
            >
              <Repeat2 className="size-5" />
              Undo repost
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem onClick={handleRetweet} className="gap-3">
                <Repeat2 className="size-5" />
                Repost
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowQuoteDialog(true)}
                className="gap-3"
              >
                <PenLine className="size-5" />
                Quote
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Quote Dialog */}
      <Dialog open={showQuoteDialog} onOpenChange={setShowQuoteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add a comment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Add a comment..."
              value={quoteText}
              onChange={(e) => setQuoteText(e.target.value)}
              maxLength={280}
              className="min-h-[120px] resize-none"
            />
            <div className="text-right mt-2 text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
              {quoteText.length}/280
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowQuoteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleQuoteSubmit}
              disabled={!quoteText.trim() || isLoading}
              className="bg-green-500 hover:bg-green-600"
            >
              {isLoading ? "Posting..." : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
