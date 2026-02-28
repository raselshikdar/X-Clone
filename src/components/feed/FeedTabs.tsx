"use client";

import { cn } from "@/lib/utils";

export type FeedTabType = "forYou" | "following";

interface FeedTabsProps {
  activeTab: FeedTabType;
  onTabChange: (tab: FeedTabType) => void;
  isLoading?: boolean;
}

export function FeedTabs({ activeTab, onTabChange, isLoading }: FeedTabsProps) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20",
        "bg-black/80",
        "backdrop-blur-md",
        "border-b border-twitter-border-dark"
      )}
    >
      <div className="flex">
        <button
          onClick={() => onTabChange("forYou")}
          disabled={isLoading}
          className={cn(
            "flex-1 py-4 px-4",
            "text-center font-bold text-[15px]",
            "transition-colors duration-200",
            "hover:bg-twitter-hover-dark",
            "disabled:opacity-50",
            activeTab === "forYou"
              ? "text-white"
              : "text-gray-500"
          )}
        >
          <span className="relative inline-block">
            For you
            {activeTab === "forYou" && (
              <span
                className={cn(
                  "absolute -bottom-4 left-1/2 -translate-x-1/2",
                  "h-1 w-14 rounded-full",
                  "bg-twitter-blue"
                )}
              />
            )}
          </span>
        </button>
        <button
          onClick={() => onTabChange("following")}
          disabled={isLoading}
          className={cn(
            "flex-1 py-4 px-4",
            "text-center font-bold text-[15px]",
            "transition-colors duration-200",
            "hover:bg-twitter-hover-dark",
            "disabled:opacity-50",
            activeTab === "following"
              ? "text-white"
              : "text-gray-500"
          )}
        >
          <span className="relative inline-block">
            Following
            {activeTab === "following" && (
              <span
                className={cn(
                  "absolute -bottom-4 left-1/2 -translate-x-1/2",
                  "h-1 w-14 rounded-full",
                  "bg-twitter-blue"
                )}
              />
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
