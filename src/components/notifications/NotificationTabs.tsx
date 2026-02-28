"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TabItem {
  label: string;
  href: string;
  filter?: string;
}

const tabs: TabItem[] = [
  { label: "All", href: "/notifications", filter: "all" },
  { label: "Mentions", href: "/notifications/mentions", filter: "mentions" },
];

interface NotificationTabsProps {
  unreadCount?: number;
  mentionsCount?: number;
}

export function NotificationTabs({
  unreadCount = 0,
  mentionsCount = 0,
}: NotificationTabsProps) {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-20 bg-white dark:bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-twitter-border dark:border-twitter-border-dark">
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-twitter-border dark:border-twitter-border-dark">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex-1 flex items-center justify-center",
                "h-12 px-4",
                "text-[15px] font-medium",
                "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
                "transition-colors duration-200",
                isActive && "font-bold"
              )}
            >
              <span>{tab.label}</span>

              {/* Unread count badge for All tab */}
              {tab.filter === "all" && unreadCount > 0 && (
                <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-twitter-blue rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}

              {/* Mentions count badge */}
              {tab.filter === "mentions" && mentionsCount > 0 && (
                <span className="ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-white bg-twitter-blue rounded-full">
                  {mentionsCount > 99 ? "99+" : mentionsCount}
                </span>
              )}

              {/* Active indicator */}
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-twitter-blue rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
