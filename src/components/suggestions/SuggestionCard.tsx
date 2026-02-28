"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/Avatar";

interface SuggestionCardProps {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  verified?: boolean;
  bio?: string | null;
  reason?: string;
  isFollowing?: boolean;
  onFollow?: () => Promise<void>;
  onDismiss?: () => void;
  showDismiss?: boolean;
}

export function SuggestionCard({
  id,
  username,
  displayName,
  avatar,
  verified,
  bio,
  reason,
  isFollowing = false,
  onFollow,
  onDismiss,
  showDismiss = true,
}: SuggestionCardProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [following, setFollowing] = React.useState(isFollowing);

  const handleFollow = async () => {
    if (!onFollow) return;

    setIsLoading(true);
    try {
      await onFollow();
      setFollowing(true);
    } catch (error) {
      console.error("Error following user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3",
        "px-4 py-3",
        "hover:bg-twitter-hover-dark",
        "transition-colors duration-200"
      )}
    >
      <Link
        href={`/${username}`}
        className="flex items-center gap-3 flex-1 min-w-0"
      >
        <UserAvatar
          src={avatar}
          alt={displayName || username}
          fallback={displayName || username}
          size="md"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-[15px] truncate text-white hover:underline">
              {displayName || username}
            </span>
            {verified && (
              <CheckCircle2 className="size-4 text-twitter-blue fill-twitter-blue flex-shrink-0" />
            )}
          </div>
          <div className="text-gray-500 text-[15px] truncate">
            @{username}
          </div>
          {bio && (
            <p className="text-[15px] mt-0.5 line-clamp-2 text-white">{bio}</p>
          )}
          {reason && (
            <p className="text-[13px] text-gray-500 mt-0.5">
              {reason}
            </p>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          onClick={handleFollow}
          disabled={isLoading || following}
          className={cn(
            "rounded-full font-bold h-8 px-4 text-[15px]",
            following
              ? "bg-transparent border border-gray-600 text-white hover:bg-red-500/10 hover:border-red-500 hover:text-red-500"
              : "bg-white text-black hover:bg-gray-200"
          )}
        >
          {isLoading ? "..." : following ? "Following" : "Follow"}
        </Button>
        {showDismiss && onDismiss && !following && (
          <button
            onClick={onDismiss}
            className="p-2 rounded-full hover:bg-twitter-blue/10 hover:text-twitter-blue text-gray-500 transition-colors"
            aria-label="Dismiss suggestion"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
