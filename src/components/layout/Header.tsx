"use client"

import * as React from "react"
import { ArrowLeft, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface HeaderProps {
  title: string
  showBackButton?: boolean
  backHref?: string
  onBack?: () => void
  actions?: React.ReactNode
  subtitle?: string
  className?: string
}

export function Header({
  title,
  showBackButton = true,
  backHref,
  onBack,
  actions,
  subtitle,
  className,
}: HeaderProps) {
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backHref) {
      window.history.back()
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-20",
        "flex items-center gap-6",
        "h-[53px] px-4",
        "bg-white/80 dark:bg-black/80",
        "backdrop-blur-md",
        "border-b border-twitter-border dark:border-twitter-border-dark",
        className
      )}
    >
      {showBackButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="rounded-full size-9 -ml-2 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
        >
          <ArrowLeft className="size-5" />
          <span className="sr-only">Back</span>
        </Button>
      )}

      <div className="flex-1">
        <h1 className="font-bold text-xl leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-1">
          {actions}
        </div>
      )}
    </header>
  )
}

export function HeaderWithSettings({
  title,
  showBackButton = true,
  onSettings,
  className,
}: {
  title: string
  showBackButton?: boolean
  onSettings?: () => void
  className?: string
}) {
  return (
    <Header
      title={title}
      showBackButton={showBackButton}
      actions={
        <Button
          variant="ghost"
          size="icon"
          onClick={onSettings}
          className="rounded-full size-9 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
        >
          <Settings className="size-5" />
          <span className="sr-only">Settings</span>
        </Button>
      }
      className={className}
    />
  )
}
