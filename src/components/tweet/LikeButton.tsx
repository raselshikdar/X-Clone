"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInteractionStore } from "@/stores/interactionStore"
import { toast } from "@/hooks/use-toast"

interface LikeButtonProps {
  tweetId: string
  initialIsLiked?: boolean
  initialLikesCount?: number
  onLikeChange?: (isLiked: boolean, likesCount: number) => void
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

export function LikeButton({
  tweetId,
  initialIsLiked = false,
  initialLikesCount = 0,
  onLikeChange,
  showCount = true,
  size = "md",
  className,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  
  const { 
    getInteraction, 
    setInteraction, 
    toggleLike, 
    revertLike 
  } = useInteractionStore()
  
  // Initialize state in store
  React.useEffect(() => {
    const existing = getInteraction(tweetId)
    if (!existing) {
      setInteraction(tweetId, {
        isLiked: initialIsLiked,
        likesCount: initialLikesCount,
      })
    }
  }, [tweetId, initialIsLiked, initialLikesCount])
  
  const interaction = getInteraction(tweetId)
  const isLiked = interaction?.isLiked ?? initialIsLiked
  const likesCount = interaction?.likesCount ?? initialLikesCount
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return
    
    // Optimistic update
    const { wasLiked, previousState } = toggleLike(tweetId)
    
    // Trigger animation
    if (!wasLiked) {
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/tweets/${tweetId}/like`, {
        method: wasLiked ? "DELETE" : "POST",
      })
      
      if (!response.ok) {
        throw new Error("Failed to update like")
      }
      
      const data = await response.json()
      setInteraction(tweetId, {
        isLiked: data.isLiked,
        likesCount: data.likesCount,
      })
      
      onLikeChange?.(data.isLiked, data.likesCount)
    } catch (error) {
      // Revert on error
      revertLike(tweetId, previousState)
      toast({
        title: "Error",
        description: "Failed to update like. Please try again.",
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
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={cn(
        "flex items-center gap-1 group",
        "rounded-full",
        "hover:bg-pink-500/10",
        "text-twitter-secondary dark:text-twitter-secondary-dark",
        isLiked ? "text-pink-500" : "hover:text-pink-500",
        "transition-colors duration-200",
        "disabled:opacity-50",
        buttonSizeClasses[size],
        className
      )}
    >
      <Heart
        className={cn(
          sizeClasses[size],
          isLiked && "fill-pink-500",
          isAnimating && "animate-ping-once"
        )}
      />
      {showCount && likesCount > 0 && (
        <span
          className={cn(
            textClasses[size],
            isLiked ? "text-pink-500" : "group-hover:text-pink-500"
          )}
        >
          {formatNumber(likesCount)}
        </span>
      )}
    </button>
  )
}
