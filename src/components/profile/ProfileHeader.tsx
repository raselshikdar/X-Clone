"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Link as LinkIcon,
  MoreHorizontal,
  Lock,
  Share,
  UserX,
  Flag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStore, UserProfile } from "@/stores/userStore";
import { VerifiedBadge, VerificationType } from "@/components/verification";

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditProfile?: () => void;
}

function formatJoinDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function parseBio(bio: string): React.ReactNode {
  const parts = bio.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <Link
          key={index}
          href={`/${part.slice(1)}`}
          className="text-twitter-blue hover:underline"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith("#")) {
      return (
        <Link
          key={index}
          href={`/search?q=${encodeURIComponent(part)}`}
          className="text-twitter-blue hover:underline"
        >
          {part}
        </Link>
      );
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      try {
        const url = new URL(part);
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-twitter-blue hover:underline"
          >
            {part}
          </a>
        );
      } catch {
        return part;
      }
    }
    return part;
  });
}

export function ProfileHeader({ profile, onEditProfile }: ProfileHeaderProps) {
  const router = useRouter();
  const { followUser, unfollowUser } = useUserStore();
  const [isFollowLoading, setIsFollowLoading] = React.useState(false);
  const [isFollowing, setIsFollowing] = React.useState(profile.isFollowing);
  const [followersCount, setFollowersCount] = React.useState(
    profile.followersCount
  );

  const handleFollow = async () => {
    if (isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        const result = await unfollowUser(profile.username);
        if (result.success) {
          setIsFollowing(false);
          setFollowersCount((prev) => Math.max(0, prev - 1));
        }
      } else {
        const result = await followUser(profile.username);
        if (result.success) {
          setIsFollowing(true);
          setFollowersCount((prev) => prev + 1);
        }
      }
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      // Could add toast notification here
    } catch {
      // Fallback for browsers that don't support clipboard API
    }
  };

  return (
    <div className="border-b border-twitter-border dark:border-twitter-border-dark">
      {/* Banner */}
      <div className="relative h-[200px] bg-gray-200 dark:bg-gray-800 w-full">
        {profile.banner ? (
          <img
            src={profile.banner}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-twitter-gray dark:bg-twitter-gray-dark" />
        )}
      </div>

      {/* Profile Info */}
      <div className="px-4 pb-4">
        {/* Avatar and Actions Row */}
        <div className="flex justify-between items-start -mt-16 mb-3">
          {/* Avatar */}
          <UserAvatar
            src={profile.avatar}
            alt={profile.displayName || profile.username}
            fallback={profile.displayName || profile.username}
            size="xl"
            className="ring-4 ring-white dark:ring-black rounded-full"
          />

          {/* Action Buttons */}
          <div className="mt-20 flex items-center gap-2">
            {profile.isOwnProfile ? (
              <Button
                variant="outline"
                onClick={onEditProfile}
                className="rounded-full font-bold min-w-[108px] h-8 px-4"
              >
                Edit profile
              </Button>
            ) : (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full size-8"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[280px]">
                    <DropdownMenuItem className="gap-3">
                      <UserX className="size-5" />
                      Block @{profile.username}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-3">
                      <Flag className="size-5" />
                      Report @{profile.username}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-3">
                      <Share className="size-5" />
                      Share profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                  className={cn(
                    "rounded-full font-bold min-w-[108px] h-8 px-4",
                    isFollowing
                      ? "bg-transparent text-black dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-500 dark:hover:bg-red-500/10"
                      : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  )}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Name and Username */}
        <div className="mb-1">
          <div className="flex items-center gap-1">
            <h1 className="text-xl font-bold">
              {profile.displayName || profile.username}
            </h1>
            {profile.verified && profile.verification && (
              <VerifiedBadge 
                type={profile.verification.type as VerificationType} 
                size="md" 
              />
            )}
            {profile.verified && !profile.verification && (
              <VerifiedBadge type="blue" size="md" />
            )}
          </div>
          <div className="flex items-center gap-1 text-twitter-secondary dark:text-twitter-secondary-dark">
            <span>@{profile.username}</span>
            {profile.isPrivate && (
              <Lock className="size-4 ml-1" title="Private account" />
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mb-3 text-[15px] whitespace-pre-wrap break-words">
            {parseBio(profile.bio)}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-twitter-secondary dark:text-twitter-secondary-dark text-[15px] mb-3">
          {profile.location && (
            <div className="flex items-center gap-1">
              <MapPin className="size-4" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.website && (
            <div className="flex items-center gap-1">
              <LinkIcon className="size-4" />
              <a
                href={
                  profile.website.startsWith("http")
                    ? profile.website
                    : `https://${profile.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-twitter-blue hover:underline"
              >
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="size-4" />
            <span>Joined {formatJoinDate(profile.createdAt)}</span>
          </div>
        </div>

        {/* Following/Followers Count */}
        <div className="flex gap-4 text-[15px]">
          <Link
            href={`/${profile.username}/following`}
            className="hover:underline"
          >
            <span className="font-bold">
              {formatNumber(profile.followingCount)}
            </span>{" "}
            <span className="text-twitter-secondary dark:text-twitter-secondary-dark">
              Following
            </span>
          </Link>
          <Link
            href={`/${profile.username}/followers`}
            className="hover:underline"
          >
            <span className="font-bold">{formatNumber(followersCount)}</span>{" "}
            <span className="text-twitter-secondary dark:text-twitter-secondary-dark">
              Followers
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
