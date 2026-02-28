"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function NotificationBadge({
  count,
  className,
  size = "md",
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const sizeClasses = {
    sm: "min-w-[16px] h-4 text-[10px] px-1",
    md: "min-w-[18px] h-[18px] text-[11px] px-1",
    lg: "min-w-[20px] h-5 text-[11px] px-1.5",
  };

  return (
    <span
      className={cn(
        "flex items-center justify-center",
        "font-bold text-white bg-twitter-blue",
        "rounded-full",
        sizeClasses[size],
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

// Hook to fetch unread notification count
export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [mentionsCount, setMentionsCount] = React.useState(0);

  const fetchUnreadCount = React.useCallback(async () => {
    try {
      const response = await fetch("/api/notifications?limit=1");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  }, []);

  React.useEffect(() => {
    fetchUnreadCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  return { unreadCount, mentionsCount, refetch: fetchUnreadCount };
}
