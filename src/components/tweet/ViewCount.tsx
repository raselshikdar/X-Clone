"use client"

import * as React from "react"
import { BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useInteractionStore } from "@/stores/interactionStore"

interface ViewCountProps {
  tweetId: string
  initialViewsCount?: number
  showIcon?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
  recordView?: boolean
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

export function ViewCount({
  tweetId,
  initialViewsCount = 0,
  showIcon = true,
  size = "md",
  className,
  recordView = false,
}: ViewCountProps) {
  const [hasRecorded, setHasRecorded] = React.useState(false)
  
  const { 
    getInteraction, 
    setInteraction, 
    incrementViews 
  } = useInteractionStore()
  
  // Initialize state in store
  React.useEffect(() => {
    const existing = getInteraction(tweetId)
    if (!existing) {
      setInteraction(tweetId, {
        viewsCount: initialViewsCount,
      })
    }
  }, [tweetId, initialViewsCount])
  
  // Record view on mount (if enabled)
  React.useEffect(() => {
    if (recordView && !hasRecorded) {
      const recordViewCount = async () => {
        try {
          await fetch(`/api/tweets/${tweetId}/view`, {
            method: "POST",
          })
          incrementViews(tweetId)
          setHasRecorded(true)
        } catch (error) {
          console.error("Error recording view:", error)
        }
      }
      
      // Delay to avoid immediate fire
      const timer = setTimeout(recordViewCount, 1000)
      return () => clearTimeout(timer)
    }
  }, [tweetId, recordView, hasRecorded, incrementViews])
  
  const interaction = getInteraction(tweetId)
  const viewsCount = interaction?.viewsCount ?? initialViewsCount
  
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
  
  if (viewsCount === 0) return null
  
  return (
    <button
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
      {showIcon && (
        <BarChart3 className={cn(sizeClasses[size], "group-hover:fill-twitter-blue/10")} />
      )}
      <span className={cn(textClasses[size], "group-hover:text-twitter-blue")}>
        {formatNumber(viewsCount)} {viewsCount === 1 ? "view" : "views"}
      </span>
    </button>
  )
}
