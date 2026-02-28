"use client";

import { useEffect, useRef, useCallback } from "react";
import { FeedTabs, type FeedTabType } from "./FeedTabs";
import { FeedTweet } from "./FeedTweet";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { EmptyFeed } from "./EmptyFeed";
import { useFeed } from "@/hooks/useFeed";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

interface FeedProps {
  initialTab?: FeedTabType;
}

export function Feed({ initialTab = "forYou" }: FeedProps) {
  const {
    tweets,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    prefetchNextPage,
    refetchFeed,
    error,
    isAuthenticated,
  } = useFeed({ type: initialTab });

  // Real-time updates
  const { newTweetsCount, showNewTweetsButton, handleShowNewTweets } =
    useRealtimeFeed({
      onNewTweet: () => {
        // Optionally auto-refetch or show notification
      },
      enabled: false, // Disabled by default, can enable when WebSocket is ready
    });

  // Intersection observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      }
    );

    observer.observe(currentTarget);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Prefetch next page on hover
  const handleMouseEnter = useCallback(() => {
    prefetchNextPage();
  }, [prefetchNextPage]);

  // Handle like/retweet/bookmark actions
  const handleLike = useCallback(async (id: string) => {
    try {
      await fetch(`/api/tweets/${id}/like`, { method: "POST" });
    } catch (error) {
      console.error("Failed to like tweet:", error);
    }
  }, []);

  const handleRetweet = useCallback(async (id: string) => {
    try {
      await fetch(`/api/tweets/${id}/retweet`, { method: "POST" });
    } catch (error) {
      console.error("Failed to retweet:", error);
    }
  }, []);

  const handleBookmark = useCallback(async (id: string) => {
    try {
      await fetch(`/api/tweets/${id}/bookmark`, { method: "POST" });
    } catch (error) {
      console.error("Failed to bookmark tweet:", error);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/tweets/${id}`, { method: "DELETE" });
      refetchFeed();
    } catch (error) {
      console.error("Failed to delete tweet:", error);
    }
  }, [refetchFeed]);

  // Loading state
  if (isLoading) {
    return (
      <div>
        <FeedTabs activeTab={initialTab} onTabChange={() => {}} isLoading />
        <LoadingSkeleton count={5} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <FeedTabs activeTab={initialTab} onTabChange={() => {}} />
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-red-500 mb-4">Failed to load feed</p>
          <Button onClick={() => refetchFeed()} variant="outline">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div onMouseEnter={handleMouseEnter}>
      {/* New tweets button */}
      {showNewTweetsButton && (
        <button
          onClick={handleShowNewTweets}
          className={cn(
            "sticky top-16 z-20",
            "flex items-center justify-center gap-2",
            "w-full py-3",
            "bg-twitter-blue text-white",
            "text-sm font-medium",
            "transition-all duration-200",
            "hover:bg-twitter-blue/90"
          )}
        >
          <ArrowUp className="size-4" />
          {newTweetsCount === 1
            ? "Show 1 new post"
            : `Show ${newTweetsCount} new posts`}
        </button>
      )}

      {/* Tweet list */}
      {tweets.length === 0 ? (
        <EmptyFeed type={initialTab} isAuthenticated={isAuthenticated} />
      ) : (
        <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
          {tweets.map((tweet) => (
            <FeedTweet
              key={tweet.id}
              tweet={{
                id: tweet.id,
                user: tweet.user,
                content: tweet.content,
                media: tweet.media,
                createdAt: new Date(tweet.createdAt),
                replies: tweet.replies,
                retweets: tweet.retweets,
                likes: tweet.likes,
                views: tweet.views,
                bookmarks: tweet.bookmarks,
                isLiked: tweet.isLiked,
                isRetweeted: tweet.isRetweeted,
                isBookmarked: tweet.isBookmarked,
              }}
              replyTo={tweet.inReplyTo || undefined}
              onLike={handleLike}
              onRetweet={handleRetweet}
              onBookmark={handleBookmark}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      <div ref={observerTarget} className="h-10">
        {isFetchingNextPage && <LoadingSkeleton count={2} />}
      </div>

      {/* End of feed */}
      {!hasNextPage && tweets.length > 0 && (
        <div className="py-8 text-center text-twitter-secondary dark:text-twitter-secondary-dark">
          You&apos;ve reached the end
        </div>
      )}
    </div>
  );
}
