"use client";

import Link from "next/link";
import { TweetCard, type Tweet } from "@/components/common/TweetCard";
import { UserAvatar } from "@/components/common/Avatar";
import { cn } from "@/lib/utils";
import { Repeat2 } from "lucide-react";

interface FeedTweetProps {
  tweet: Tweet;
  retweetBy?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  replyTo?: {
    id: string;
    username: string;
  };
  onLike?: (id: string, isCurrentlyLiked: boolean) => void;
  onRetweet?: (id: string, isCurrentlyRetweeted: boolean) => void;
  onBookmark?: (id: string, isCurrentlyBookmarked: boolean) => void;
  onDelete?: (id: string) => void;
  onReply?: (id: string) => void;
}

export function FeedTweet({
  tweet,
  retweetBy,
  replyTo,
  onLike,
  onRetweet,
  onBookmark,
  onDelete,
  onReply,
}: FeedTweetProps) {
  return (
    <div>
      {/* Retweet indicator */}
      {retweetBy && (
        <Link
          href={`/profile/${retweetBy.username}`}
          className={cn(
            "flex items-center gap-1 px-4 pt-3 pb-0",
            "text-[13px] text-gray-500",
            "hover:underline"
          )}
        >
          <Repeat2 className="size-4 mr-1" />
          <UserAvatar
            src={retweetBy.avatar}
            fallback={retweetBy.name}
            size="xs"
            className="mr-1"
          />
          <span className="font-medium">{retweetBy.name}</span>
          <span>Reposted</span>
        </Link>
      )}

      {/* Reply indicator */}
      {replyTo && (
        <Link
          href={`/status/${replyTo.id}`}
          className={cn(
            "flex items-center gap-1 px-4 pt-3 pb-0",
            "text-[13px] text-gray-500",
            "hover:underline"
          )}
        >
          <span>
            Replying to{" "}
            <span className="text-twitter-blue">@{replyTo.username}</span>
          </span>
        </Link>
      )}

      {/* Main tweet card */}
      <TweetCard
        tweet={tweet}
        onLike={onLike}
        onRetweet={onRetweet}
        onBookmark={onBookmark}
        onDelete={onDelete}
        onReply={onReply}
      />
    </div>
  );
}
