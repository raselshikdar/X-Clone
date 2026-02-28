"use client"

import * as React from "react"
import { Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInteractionStore } from "@/stores/interactionStore"
import { toast } from "@/hooks/use-toast"

interface BookmarkButtonProps {
  tweetId: string
  initialIsBookmarked?: boolean
  onBookmarkChange?: (isBookmarked: boolean) => void
  size?: "sm" | "md" | "lg"
  className?: string
  showToast?: boolean
}

export function BookmarkButton({
  tweetId,
  initialIsBookmarked = false,
  onBookmarkChange,
  size = "md",
  className,
  showToast = true,
}: BookmarkButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  
  const { 
    getInteraction, 
    setInteraction, 
    toggleBookmark, 
    revertBookmark 
  } = useInteractionStore()
  
  // Initialize state in store
  React.useEffect(() => {
    const existing = getInteraction(tweetId)
    if (!existing) {
      setInteraction(tweetId, {
        isBookmarked: initialIsBookmarked,
      })
    }
  }, [tweetId, initialIsBookmarked])
  
  const interaction = getInteraction(tweetId)
  const isBookmarked = interaction?.isBookmarked ?? initialIsBookmarked
  
  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return
    
    // Optimistic update
    const { wasBookmarked, previousState } = toggleBookmark(tweetId)
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/tweets/${tweetId}/bookmark`, {
        method: wasBookmarked ? "DELETE" : "POST",
      })
      
      if (!response.ok) {
        throw new Error("Failed to update bookmark")
      }
      
      const data = await response.json()
      setInteraction(tweetId, {
        isBookmarked: data.isBookmarked,
      })
      
      onBookmarkChange?.(data.isBookmarked)
      
      if (showToast) {
        toast({
          title: data.isBookmarked ? "Tweet saved" : "Tweet removed from bookmarks",
          description: data.isBookmarked 
            ? "This tweet has been added to your bookmarks."
            : "This tweet has been removed from your bookmarks.",
        })
      }
    } catch (error) {
      // Revert on error
      revertBookmark(tweetId, previousState)
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
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
  
  return (
    <button
      onClick={handleBookmark}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-1 group",
        "rounded-full",
        "hover:bg-twitter-blue/10",
        "text-twitter-secondary dark:text-twitter-secondary-dark",
        isBookmarked ? "text-twitter-blue" : "hover:text-twitter-blue",
        "transition-colors duration-200",
        "disabled:opacity-50",
        buttonSizeClasses[size],
        className
      )}
    >
      <Bookmark
        className={cn(
          sizeClasses[size],
          isBookmarked && "fill-twitter-blue"
        )}
      />
    </button>
  )
}
