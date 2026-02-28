"use client";

import * as React from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SuggestionCard } from "./SuggestionCard";

interface Suggestion {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  verified: boolean;
  bio: string | null;
  followersCount: number;
  reason?: string;
}

interface WhoToFollowProps {
  className?: string;
  limit?: number;
  showMore?: boolean;
}

export function WhoToFollow({
  className,
  limit = 3,
  showMore = true,
}: WhoToFollowProps) {
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  const fetchSuggestions = React.useCallback(async (excludeIds: string[] = []) => {
    setIsLoading(true);
    try {
      const excludeParam = excludeIds.length > 0 ? `&exclude=${excludeIds.join(",")}` : "";
      const response = await fetch(`/api/suggestions?limit=${limit}${excludeParam}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleFollow = async (userId: string) => {
    const response = await fetch(`/api/users/${suggestions.find(s => s.id === userId)?.username}/follow`, {
      method: "POST",
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to follow user");
    }
  };

  const handleDismiss = async (userId: string) => {
    // Add to dismissed set
    setDismissed((prev) => new Set([...prev, userId]));

    // Try to fetch a replacement
    try {
      const response = await fetch(
        `/api/suggestions?limit=1&exclude=${[...dismissed, userId].join(",")}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.suggestions.length > 0) {
          setSuggestions((prev) => [
            ...prev.filter((s) => s.id !== userId),
            ...data.suggestions,
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching replacement suggestion:", error);
    }
  };

  const handleRefresh = () => {
    setDismissed(new Set());
    fetchSuggestions();
  };

  // Filter out dismissed suggestions
  const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.id));

  return (
    <div className={cn("rounded-2xl bg-[#16181c] overflow-hidden", className)}>
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="font-bold text-xl text-white">Who to follow</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          className="size-8 rounded-full hover:bg-twitter-blue/10 hover:text-twitter-blue text-gray-500"
          title="Refresh suggestions"
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>
      <div className="mt-2">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gray-800 animate-pulse" />
                <div>
                  <div className="h-4 w-20 bg-gray-800 rounded animate-pulse mb-1" />
                  <div className="h-3 w-16 bg-gray-800 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : visibleSuggestions.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500">
            No suggestions available
          </div>
        ) : (
          visibleSuggestions.slice(0, limit).map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              id={suggestion.id}
              username={suggestion.username}
              displayName={suggestion.displayName}
              avatar={suggestion.avatar}
              verified={suggestion.verified}
              bio={suggestion.bio}
              reason={suggestion.reason}
              onFollow={() => handleFollow(suggestion.id)}
              onDismiss={() => handleDismiss(suggestion.id)}
            />
          ))
        )}
      </div>
      {showMore && (
        <Link
          href="/explore"
          className="block px-4 py-3 text-twitter-blue hover:bg-twitter-hover-dark transition-colors duration-200"
        >
          Show more
        </Link>
      )}
    </div>
  );
}
