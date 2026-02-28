"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { TweetCard } from "@/components/common/TweetCard";
import { Button } from "@/components/ui/button";
import type { Tweet } from "@/stores/tweetStore";

interface TweetThreadProps {
  tweets: Tweet[];
  maxVisible?: number;
  showExpand?: boolean;
  className?: string;
  onLike?: (id: string) => void;
  onRetweet?: (id: string) => void;
  onBookmark?: (id: string) => void;
  onDelete?: (id: string) => void;
  onReply?: (id: string) => void;
}

export function TweetThread({
  tweets,
  maxVisible = 2,
  showExpand = true,
  className,
  onLike,
  onRetweet,
  onBookmark,
  onDelete,
  onReply,
}: TweetThreadProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!tweets || tweets.length === 0) return null;

  const visibleTweets = isExpanded ? tweets : tweets.slice(0, maxVisible);
  const hasMore = tweets.length > maxVisible;

  return (
    <div className={cn("", className)}>
      {visibleTweets.map((tweet, index) => (
        <div key={tweet.id} className="relative">
          {/* Thread connector line */}
          {index < visibleTweets.length - 1 && (
            <div
              className={cn(
                "absolute left-[22px] top-[52px] bottom-0 w-0.5",
                "bg-twitter-border dark:bg-twitter-border-dark",
                "z-0"
              )}
            />
          )}

          {/* Tweet */}
          <div className="relative z-10">
            <TweetCard
              tweet={{
                id: tweet.id,
                user: {
                  id: tweet.author.id,
                  name: tweet.author.name,
                  username: tweet.author.username,
                  avatar: tweet.author.avatar,
                  verified: tweet.author.verified,
                },
                content: tweet.content || "",
                media: tweet.media?.map((m) => ({
                  id: m.id,
                  type: m.type,
                  url: m.url,
                  thumbnail: m.thumbnail,
                })),
                createdAt: tweet.createdAt,
                replies: tweet._count.replies,
                retweets: tweet._count.retweets,
                likes: tweet._count.likes,
                views: tweet.views,
                isLiked: tweet.isLiked,
                isRetweeted: tweet.isRetweeted,
                isBookmarked: tweet.isBookmarked,
              }}
              onLike={onLike}
              onRetweet={onRetweet}
              onBookmark={onBookmark}
              onDelete={onDelete}
              onReply={onReply}
            />
          </div>
        </div>
      ))}

      {/* Show more / Show less button */}
      {showExpand && hasMore && (
        <div className="px-4 py-3 border-b border-twitter-border dark:border-twitter-border-dark">
          {!isExpanded ? (
            <Link
              href={`/tweet/${tweets[0].id}`}
              className="text-twitter-blue text-[15px] hover:underline"
            >
              Show this thread
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-twitter-blue hover:bg-twitter-blue/10"
            >
              <ChevronUp className="size-4 mr-1" />
              Show less
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Thread connector for reply chains
export function ThreadConnector({
  showLine,
  children,
}: {
  showLine: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {showLine && (
        <div
          className={cn(
            "absolute left-[22px] top-0 bottom-0 w-0.5",
            "bg-twitter-border dark:bg-twitter-border-dark"
          )}
        />
      )}
      {children}
    </div>
  );
}

// Inline thread preview (for showing a few tweets)
export function TweetThreadPreview({
  tweets,
  className,
}: {
  tweets: Tweet[];
  className?: string;
}) {
  if (!tweets || tweets.length === 0) return null;

  const firstTweet = tweets[0];

  return (
    <div className={cn("rounded-2xl border border-twitter-border dark:border-twitter-border-dark overflow-hidden", className)}>
      {/* First tweet preview */}
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex -space-x-1">
            {tweets.slice(0, 3).map((t) => (
              <div
                key={t.id}
                className="size-5 rounded-full ring-2 ring-white dark:ring-black overflow-hidden"
              >
                {t.author.avatar ? (
                  <img
                    src={t.author.avatar}
                    alt={t.author.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-twitter-blue/20 flex items-center justify-center text-[10px] font-bold text-twitter-blue">
                    {t.author.name[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
          <span className="text-[13px] text-twitter-secondary">
            {tweets.length > 1
              ? `${tweets.length} Tweets in this thread`
              : "1 Tweet in this thread"}
          </span>
        </div>

        <Link
          href={`/tweet/${firstTweet.id}`}
          className="text-twitter-blue text-[15px] hover:underline font-medium"
        >
          Show this thread
        </Link>
      </div>
    </div>
  );
}
