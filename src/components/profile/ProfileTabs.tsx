"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type ProfileTab = "tweets" | "replies" | "media" | "likes";

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  isOwnProfile?: boolean;
}

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "tweets", label: "Tweets" },
  { id: "replies", label: "Replies" },
  { id: "media", label: "Media" },
  { id: "likes", label: "Likes" },
];

export function ProfileTabs({
  activeTab,
  onTabChange,
  isOwnProfile = false,
}: ProfileTabsProps) {
  return (
    <div className="flex border-b border-twitter-border dark:border-twitter-border-dark">
      {tabs.map((tab) => {
        // Only show likes tab for own profile or when explicitly allowed
        if (tab.id === "likes" && !isOwnProfile) {
          return null;
        }

        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 py-4 px-4 text-center relative",
              "text-[15px] font-medium",
              "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
              "transition-colors duration-200",
              isActive
                ? "font-bold text-black dark:text-white"
                : "text-twitter-secondary dark:text-twitter-secondary-dark"
            )}
          >
            {tab.label}
            {isActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[56px] h-1 bg-twitter-blue rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
