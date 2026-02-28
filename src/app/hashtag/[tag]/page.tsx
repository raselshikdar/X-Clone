"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, MoreHorizontal, BellOff, Bell, ArrowDownUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TweetCard, type Tweet } from "@/components/common/TweetCard";
import { LoadingSkeleton } from "@/components/feed/LoadingSkeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HashtagTab = "top" | "latest" | "media";

export default function HashtagPage() {
  const params = useParams();
  const tag = decodeURIComponent(params.tag as string);

  const [hashtagInfo, setHashtagInfo] = React.useState<{
    name: string;
    tweetCount: number;
    isFollowing: boolean;
  } | null>(null);
  const [tweets, setTweets] = React.useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<HashtagTab>("top");
  const [isFollowing, setIsFollowing] = React.useState(false);
  const observerTarget = React.useRef<HTMLDivElement>(null);

  // Fetch hashtag tweets
  const fetchTweets = React.useCallback(
    async (cursor?: string, append = false) => {
      if (append) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
        setTweets([]);
      }

      try {
        const url = `/api/hashtags/${encodeURIComponent(tag)}?tab=${activeTab}${cursor ? `&cursor=${cursor}` : ""}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch hashtag");
        }

        const data = await response.json();
        setHashtagInfo(data.hashtag);
        setTweets((prev) => (append ? [...prev, ...data.tweets] : data.tweets));
        setNextCursor(data.nextCursor);
        setIsFollowing(data.hashtag.isFollowing);
      } catch (e) {
        console.error("Failed to fetch hashtag:", e);
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [tag, activeTab]
  );

  // Fetch on mount and when tab changes
  React.useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);

  // Infinite scroll
  React.useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && nextCursor && !isFetchingMore) {
          fetchTweets(nextCursor, true);
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(currentTarget);
    return () => observer.disconnect();
  }, [nextCursor, isFetchingMore, fetchTweets]);

  // Handle tweet actions
  const handleLike = async (id: string) => {
    await fetch(`/api/tweets/${id}/like`, { method: "POST" });
  };

  const handleRetweet = async (id: string) => {
    await fetch(`/api/tweets/${id}/retweet`, { method: "POST" });
  };

  const handleBookmark = async (id: string) => {
    await fetch(`/api/tweets/${id}/bookmark`, { method: "POST" });
  };

  const handleFollowHashtag = async () => {
    setIsFollowing(!isFollowing);
    // API call to follow/unfollow hashtag would go here
  };

  const formatTweetCount = (count: number): string => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  return (
    <main className="min-h-screen">
      <div className="max-w-[600px] mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-6 px-4 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-bold text-xl">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </h1>
              {hashtagInfo && (
                <p className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
                  {formatTweetCount(hashtagInfo.tweetCount)} posts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Hashtag info card */}
        {hashtagInfo && (
          <div className="px-4 py-4 border-b border-twitter-border dark:border-twitter-border-dark">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="rounded-full font-bold"
                  onClick={handleFollowHashtag}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                    >
                      <MoreHorizontal className="size-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <BellOff className="size-4 mr-2" />
                      Mute this hashtag
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      Not interested in this
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <p className="text-[15px] text-twitter-secondary dark:text-twitter-secondary-dark">
              See what people are saying about {tag.startsWith("#") ? tag : `#${tag}`}
            </p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-twitter-border dark:border-twitter-border-dark">
          {(["top", "latest", "media"] as HashtagTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-4 text-center",
                "font-bold text-[15px]",
                "capitalize",
                "transition-colors",
                "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
                activeTab === tab
                  ? "text-black dark:text-white border-b-4 border-twitter-blue"
                  : "text-twitter-secondary dark:text-twitter-secondary-dark"
              )}
            >
              {tab === "top" ? "Top" : tab === "latest" ? "Latest" : "Media"}
            </button>
          ))}
        </div>

        {/* Tweets */}
        {isLoading ? (
          <LoadingSkeleton count={5} />
        ) : !hashtagInfo || tweets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <h3 className="text-2xl font-bold mb-2">No posts yet</h3>
            <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-center">
              Be the first to post about this topic!
            </p>
          </div>
        ) : (
          <>
            {tweets.map((tweet) => (
              <TweetCard
                key={tweet.id}
                tweet={tweet}
                onLike={handleLike}
                onRetweet={handleRetweet}
                onBookmark={handleBookmark}
              />
            ))}
          </>
        )}

        {/* Infinite scroll trigger */}
        <div ref={observerTarget} className="h-10">
          {isFetchingMore && <LoadingSkeleton count={2} />}
        </div>

        {/* End of results */}
        {!nextCursor && tweets.length > 0 && !isLoading && (
          <div className="py-8 text-center text-twitter-secondary dark:text-twitter-secondary-dark">
            You&apos;ve reached the end
          </div>
        )}
      </div>
    </main>
  );
}
