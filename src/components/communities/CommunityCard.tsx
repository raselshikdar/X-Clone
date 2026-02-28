"use client";

import Link from "next/link";
import { Users, Lock, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/Avatar";

export interface CommunityCardData {
  id: string;
  name: string;
  description: string | null;
  banner: string | null;
  icon: string | null;
  isPrivate: boolean;
  memberCount: number;
  tweetCount?: number;
  createdAt: Date | string;
  owner?: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
  };
  isJoined?: boolean;
  role?: string | null;
  joinedAt?: Date | string;
}

interface CommunityCardProps {
  community: CommunityCardData;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  isJoining?: boolean;
  isLeaving?: boolean;
  showJoinButton?: boolean;
  compact?: boolean;
  className?: string;
}

function formatMemberCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + "M";
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + "K";
  }
  return count.toString();
}

export function CommunityCard({
  community,
  onJoin,
  onLeave,
  isJoining = false,
  isLeaving = false,
  showJoinButton = true,
  compact = false,
  className,
}: CommunityCardProps) {
  const handleJoinLeave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (community.isJoined) {
      onLeave?.(community.id);
    } else {
      onJoin?.(community.id);
    }
  };

  return (
    <Link href={`/communities/${community.id}`}>
      <article
        className={cn(
          "flex gap-3 p-4 rounded-2xl",
          "border border-twitter-border dark:border-twitter-border-dark",
          "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
          "transition-colors duration-200 cursor-pointer",
          className
        )}
      >
        {/* Banner or Icon */}
        <div className="shrink-0">
          {community.banner ? (
            <div className="size-14 rounded-xl overflow-hidden">
              <img
                src={community.banner}
                alt={community.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div
              className={cn(
                "size-14 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br from-twitter-blue to-blue-600"
              )}
            >
              {community.isPrivate ? (
                <Lock className="size-6 text-white" />
              ) : (
                <Globe className="size-6 text-white" />
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-bold text-[15px] truncate">
                {community.name}
              </h3>
              <div className="flex items-center gap-1 text-twitter-secondary dark:text-twitter-secondary-dark text-[13px]">
                <Users className="size-3.5" />
                <span>{formatMemberCount(community.memberCount)} members</span>
                {community.isPrivate && (
                  <>
                    <span>·</span>
                    <Lock className="size-3.5" />
                    <span>Private</span>
                  </>
                )}
              </div>
            </div>

            {showJoinButton && (
              <Button
                variant={community.isJoined ? "outline" : "default"}
                size="sm"
                onClick={handleJoinLeave}
                disabled={isJoining || isLeaving}
                className={cn(
                  "rounded-full text-[13px] font-bold px-4",
                  community.isJoined
                    ? "border-twitter-border dark:border-twitter-border-dark hover:border-red-500 hover:text-red-500"
                    : "bg-twitter-blue hover:bg-twitter-blue/90"
                )}
              >
                {isJoining || isLeaving ? (
                  <div className="size-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : community.isJoined ? (
                  "Joined"
                ) : (
                  "Join"
                )}
              </Button>
            )}
          </div>

          {!compact && community.description && (
            <p className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark line-clamp-2 mt-1">
              {community.description}
            </p>
          )}

          {community.owner && !compact && (
            <div className="flex items-center gap-1 mt-2">
              <UserAvatar
                src={community.owner.avatar}
                alt={community.owner.displayName || community.owner.username}
                fallback={community.owner.displayName || community.owner.username}
                size="xs"
              />
              <span className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
                by @{community.owner.username}
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
