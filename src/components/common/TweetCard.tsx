"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageCircle,
  Repeat2,
  Heart,
  Share,
  BarChart3,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Pin,
  UserX,
  Link2,
  VolumeX,
  Flag,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VerifiedBadge, VerificationType } from "@/components/verification";

export interface TweetMedia {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
}

export interface TweetUser {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
  verified?: boolean;
  verificationType?: VerificationType;
}

export interface TweetCommunity {
  id: string;
  name: string;
  icon?: string | null;
}

export interface Tweet {
  id: string;
  user: TweetUser;
  content: string;
  media?: TweetMedia[];
  createdAt: Date;
  replies: number;
  retweets: number;
  likes: number;
  views?: number;
  bookmarks?: number;
  isLiked?: boolean;
  isRetweeted?: boolean;
  isBookmarked?: boolean;
  isPinned?: boolean;
  community?: TweetCommunity;
}

interface TweetCardProps {
  tweet: Tweet;
  onLike?: (id: string, isCurrentlyLiked: boolean) => void;
  onRetweet?: (id: string, isCurrentlyRetweeted: boolean) => void;
  onBookmark?: (id: string, isCurrentlyBookmarked: boolean) => void;
  onDelete?: (id: string) => void;
  onReply?: (id: string) => void;
  showActions?: boolean;
  className?: string;
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

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  const d = new Date(date);
  return `${d.getMonth() + 1} ${d.getDate()}`;
}

function parseContent(content: string) {
  // Parse mentions, hashtags, and links
  const parts = content.split(/(\s+)/);
  return parts.map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <Link
          key={index}
          href={`/profile/${part.slice(1)}`}
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
            {url.hostname}
          </a>
        );
      } catch {
        return part;
      }
    }
    return part;
  });
}

function MediaGrid({ media }: { media: TweetMedia[] }) {
  if (!media || media.length === 0) return null;

  const gridClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2",
    4: "grid-cols-2",
  }[media.length] || "grid-cols-2";

  return (
    <div className={cn("grid gap-0.5 rounded-2xl overflow-hidden mt-3", gridClass)}>
      {media.slice(0, 4).map((item, index) => (
        <div
          key={item.id}
          className={cn(
            "relative",
            media.length === 3 && index === 0 && "row-span-2",
            media.length === 1 && "aspect-video"
          )}
        >
          {item.type === "image" ? (
            <img
              src={item.url}
              alt=""
              className={cn(
                "w-full h-full object-cover",
                media.length === 1 && "rounded-2xl",
                media.length === 2 && (index === 0 ? "rounded-l-2xl" : "rounded-r-2xl"),
                media.length === 3 && index === 0 && "rounded-l-2xl",
                media.length >= 4 && "aspect-square"
              )}
            />
          ) : (
            <div className="w-full h-full bg-gray-900 aspect-video flex items-center justify-center">
              <video
                src={item.url}
                poster={item.thumbnail}
                className="max-w-full max-h-full"
                controls
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function TweetCard({
  tweet,
  onLike,
  onRetweet,
  onBookmark,
  onDelete,
  onReply,
  showActions = true,
  className,
}: TweetCardProps) {
  const [isLiked, setIsLiked] = React.useState(tweet.isLiked);
  const [isRetweeted, setIsRetweeted] = React.useState(tweet.isRetweeted);
  const [isBookmarked, setIsBookmarked] = React.useState(tweet.isBookmarked);
  const [likes, setLikes] = React.useState(tweet.likes);
  const [retweets, setRetweets] = React.useState(tweet.retweets);

  const handleLike = () => {
    const newState = !isLiked;
    setIsLiked(newState);
    setLikes(newState ? likes + 1 : likes - 1);
    onLike?.(tweet.id, isLiked);
  };

  const handleRetweet = () => {
    const newState = !isRetweeted;
    setIsRetweeted(newState);
    setRetweets(newState ? retweets + 1 : retweets - 1);
    onRetweet?.(tweet.id, isRetweeted);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    onBookmark?.(tweet.id, isBookmarked);
  };

  return (
    <article
      className={cn(
        "flex gap-3 px-4 py-3",
        "border-b border-twitter-border-dark",
        "hover:bg-twitter-hover-dark",
        "transition-colors duration-200",
        className
      )}
    >
      {/* Avatar */}
      <Link href={`/profile/${tweet.user.username}`}>
        <UserAvatar
          src={tweet.user.avatar}
          alt={tweet.user.name}
          fallback={tweet.user.name}
          size="md"
          className="shrink-0"
        />
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-1 flex-wrap">
            <Link
              href={`/profile/${tweet.user.username}`}
              className="font-bold text-[15px] text-white hover:underline"
            >
              {tweet.user.name}
            </Link>
            {tweet.user.verified && tweet.user.verificationType && (
              <VerifiedBadge type={tweet.user.verificationType} size="md" />
            )}
            {tweet.user.verified && !tweet.user.verificationType && (
              <VerifiedBadge type="blue" size="md" />
            )}
            <Link
              href={`/profile/${tweet.user.username}`}
              className="text-gray-500 text-[15px]"
            >
              @{tweet.user.username}
            </Link>
            <span className="text-gray-500 text-[15px]">
              ·
            </span>
            <Link
              href={`/status/${tweet.id}`}
              className="text-gray-500 text-[15px] hover:underline"
            >
              {formatRelativeTime(tweet.createdAt)}
            </Link>
          </div>

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 -mt-1 -mr-2 rounded-full hover:bg-twitter-blue/10 hover:text-twitter-blue text-gray-500"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Tweet options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px] bg-black border-twitter-border-dark text-white">
              <DropdownMenuItem className="gap-3 focus:bg-twitter-hover-dark">
                <Pin className="size-5" />
                Pin to your profile
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-3 focus:bg-twitter-hover-dark"
                onClick={() => onDelete?.(tweet.id)}
              >
                <Trash2 className="size-5" />
                Delete
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 focus:bg-twitter-hover-dark">
                <UserX className="size-5" />
                Block @{tweet.user.username}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-twitter-border-dark" />
              <DropdownMenuItem className="gap-3 focus:bg-twitter-hover-dark">
                <VolumeX className="size-5" />
                Mute @{tweet.user.username}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 focus:bg-twitter-hover-dark">
                <Flag className="size-5" />
                Report post
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3 focus:bg-twitter-hover-dark">
                <Link2 className="size-5" />
                Copy link to post
              </DropdownMenuItem>
              <DropdownMenuItem
                className="gap-3 focus:bg-twitter-hover-dark"
                onClick={handleBookmark}
              >
                <Bookmark className="size-5" />
                {isBookmarked ? "Remove from bookmarks" : "Bookmark"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Community indicator */}
        {tweet.community && (
          <Link
            href={`/communities/${tweet.community.id}`}
            className="inline-flex items-center gap-1.5 mt-1 text-[13px] text-gray-500 hover:underline"
          >
            {tweet.community.icon ? (
              <img
                src={tweet.community.icon}
                alt={tweet.community.name}
                className="size-4 rounded"
              />
            ) : (
              <Users className="size-4" />
            )}
            <span>{tweet.community.name}</span>
          </Link>
        )}

        {/* Content */}
        <div className="text-[15px] whitespace-pre-wrap break-words mt-0.5 text-white">
          {parseContent(tweet.content)}
        </div>

        {/* Media */}
        {tweet.media && tweet.media.length > 0 && (
          <MediaGrid media={tweet.media} />
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between mt-3 max-w-[425px] -ml-2">
            {/* Reply */}
            <button
              onClick={() => onReply?.(tweet.id)}
              className={cn(
                "flex items-center gap-1 group",
                "p-2 -m-2 rounded-full",
                "hover:bg-twitter-blue/10",
                "text-gray-500",
                "hover:text-twitter-blue",
                "transition-colors duration-200"
              )}
            >
              <MessageCircle className="size-[18px] group-hover:fill-twitter-blue/10" />
              <span className="text-[13px] group-hover:text-twitter-blue">
                {tweet.replies > 0 && formatNumber(tweet.replies)}
              </span>
            </button>

            {/* Retweet */}
            <button
              onClick={handleRetweet}
              className={cn(
                "flex items-center gap-1 group",
                "p-2 -m-2 rounded-full",
                "hover:bg-green-500/10",
                "text-gray-500",
                isRetweeted ? "text-green-500" : "hover:text-green-500",
                "transition-colors duration-200"
              )}
            >
              <Repeat2 className={cn("size-[18px]", isRetweeted && "fill-green-500/10")} />
              <span className={cn(
                "text-[13px]",
                isRetweeted ? "text-green-500" : "group-hover:text-green-500"
              )}>
                {retweets > 0 && formatNumber(retweets)}
              </span>
            </button>

            {/* Like */}
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 group",
                "p-2 -m-2 rounded-full",
                "hover:bg-pink-500/10",
                "text-gray-500",
                isLiked ? "text-pink-500" : "hover:text-pink-500",
                "transition-colors duration-200"
              )}
            >
              <Heart className={cn("size-[18px]", isLiked && "fill-pink-500")} />
              <span className={cn(
                "text-[13px]",
                isLiked ? "text-pink-500" : "group-hover:text-pink-500"
              )}>
                {likes > 0 && formatNumber(likes)}
              </span>
            </button>

            {/* Views */}
            {tweet.views !== undefined && (
              <button
                className={cn(
                  "flex items-center gap-1 group",
                  "p-2 -m-2 rounded-full",
                  "hover:bg-twitter-blue/10",
                  "text-gray-500",
                  "hover:text-twitter-blue",
                  "transition-colors duration-200"
                )}
              >
                <BarChart3 className="size-[18px]" />
                <span className="text-[13px] group-hover:text-twitter-blue">
                  {formatNumber(tweet.views)}
                </span>
              </button>
            )}

            {/* Bookmark and Share */}
            <div className="flex items-center gap-0">
              <button
                onClick={handleBookmark}
                className={cn(
                  "flex items-center gap-1 group",
                  "p-2 -m-2 rounded-full",
                  "hover:bg-twitter-blue/10",
                  "text-gray-500",
                  "hover:text-twitter-blue",
                  "transition-colors duration-200"
                )}
              >
                <Bookmark className={cn("size-[18px]", isBookmarked && "fill-twitter-blue text-twitter-blue")} />
              </button>
              <button
                className={cn(
                  "flex items-center gap-1 group",
                  "p-2 -m-2 rounded-full",
                  "hover:bg-twitter-blue/10",
                  "text-gray-500",
                  "hover:text-twitter-blue",
                  "transition-colors duration-200"
                )}
              >
                <Share className="size-[18px]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
