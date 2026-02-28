"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { TweetCard, type Tweet } from "@/components/common/TweetCard";
import { UserAvatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/feed/LoadingSkeleton";
import { CheckCircle2 } from "lucide-react";

type SearchTab = "top" | "latest" | "people" | "media";

interface SearchUser {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  verified: boolean;
  bio: string | null;
  followersCount: number;
  isFollowing: boolean;
}

interface SearchResultsProps {
  query: string;
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

export function SearchResults({ query, className }: SearchResultsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<SearchTab>(
    (searchParams.get("type") as SearchTab) || "top"
  );
  const [tweets, setTweets] = React.useState<Tweet[]>([]);
  const [users, setUsers] = React.useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingMore, setIsFetchingMore] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const observerTarget = React.useRef<HTMLDivElement>(null);

  // Fetch search results
  const fetchResults = React.useCallback(
    async (cursor?: string, append = false) => {
      if (!query.trim()) return;

      if (append) {
        setIsFetchingMore(true);
      } else {
        setIsLoading(true);
        setTweets([]);
        setUsers([]);
      }
      setError(null);

      try {
        const type = activeTab === "people" ? "people" : activeTab;
        const url = `/api/search?q=${encodeURIComponent(query)}&type=${type}${cursor ? `&cursor=${cursor}` : ""}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to search");
        }

        const data = await response.json();

        if (activeTab === "people" || data.users?.length > 0) {
          setUsers((prev) => (append ? [...prev, ...data.users] : data.users));
        } else {
          setTweets((prev) =>
            append ? [...prev, ...data.tweets] : data.tweets
          );
        }
        setNextCursor(data.nextCursor);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search. Please try again.");
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [query, activeTab]
  );

  // Fetch on query or tab change
  React.useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Update URL when tab changes
  React.useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", activeTab);
    router.push(`/search?${params.toString()}`, { scroll: false });
  }, [activeTab, router, searchParams]);

  // Infinite scroll
  React.useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && nextCursor && !isFetchingMore) {
          fetchResults(nextCursor, true);
        }
      },
      { rootMargin: "100px", threshold: 0.1 }
    );

    observer.observe(currentTarget);
    return () => observer.disconnect();
  }, [nextCursor, isFetchingMore, fetchResults]);

  // Handle follow/unfollow
  const handleFollow = async (userId: string, isFollowing: boolean) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              isFollowing: !isFollowing,
              followersCount: isFollowing
                ? u.followersCount - 1
                : u.followersCount + 1,
            }
          : u
      )
    );

    try {
      const response = await fetch(`/${user.username}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
      });

      if (!response.ok) {
        // Revert on error
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  isFollowing,
                  followersCount: isFollowing
                    ? u.followersCount + 1
                    : u.followersCount - 1,
                }
              : u
          )
        );
      }
    } catch (err) {
      console.error("Failed to follow:", err);
      // Revert on error
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                isFollowing,
                followersCount: isFollowing
                  ? u.followersCount + 1
                  : u.followersCount - 1,
              }
            : u
        )
      );
    }
  };

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

  const tabs: { id: SearchTab; label: string }[] = [
    { id: "top", label: "Top" },
    { id: "latest", label: "Latest" },
    { id: "people", label: "People" },
    { id: "media", label: "Media" },
  ];

  return (
    <div className={className}>
      {/* Tabs */}
      <div className="sticky top-0 bg-white dark:bg-black z-10">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 py-4 text-center",
                "font-bold text-[15px]",
                "transition-colors",
                "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
                activeTab === tab.id
                  ? "text-black dark:text-white border-b-4 border-twitter-blue"
                  : "text-twitter-secondary dark:text-twitter-secondary-dark"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <LoadingSkeleton count={5} />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchResults()} variant="outline">
            Try again
          </Button>
        </div>
      ) : activeTab === "people" ? (
        // User results
        users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <h3 className="text-2xl font-bold mb-2">No results for &quot;{query}&quot;</h3>
            <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-center">
              Try searching for something else, or check the spelling of what you typed.
            </p>
          </div>
        ) : (
          <>
            {users.map((user) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-start justify-between gap-3",
                  "px-4 py-3",
                  "border-b border-twitter-border dark:border-twitter-border-dark",
                  "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
                  "transition-colors"
                )}
              >
                <Link
                  href={`/${user.username}`}
                  className="flex items-start gap-3 flex-1 min-w-0"
                >
                  <UserAvatar
                    src={user.avatar}
                    alt={user.name}
                    fallback={user.name}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[15px] truncate">
                        {user.name}
                      </span>
                      {user.verified && (
                        <CheckCircle2 className="size-[18px] text-twitter-blue fill-twitter-blue" />
                      )}
                    </div>
                    <div className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
                      @{user.username}
                    </div>
                    {user.bio && (
                      <p className="text-[15px] mt-1 line-clamp-2">{user.bio}</p>
                    )}
                    <div className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark mt-1">
                      {formatNumber(user.followersCount)} followers
                    </div>
                  </div>
                </Link>
                <Button
                  className={cn(
                    "rounded-full font-bold h-8 px-4 text-[15px]",
                    user.isFollowing
                      ? "bg-transparent border border-twitter-border dark:border-twitter-border-dark text-black dark:text-white hover:border-red-500 hover:text-red-500 hover:bg-red-500/10"
                      : "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                  )}
                  onClick={() => handleFollow(user.id, user.isFollowing)}
                >
                  {user.isFollowing ? "Following" : "Follow"}
                </Button>
              </div>
            ))}
          </>
        )
      ) : // Tweet results
      tweets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <h3 className="text-2xl font-bold mb-2">No results for &quot;{query}&quot;</h3>
          <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-center">
            Try searching for something else, or check the spelling of what you typed.
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
      {!nextCursor && (tweets.length > 0 || users.length > 0) && !isLoading && (
        <div className="py-8 text-center text-twitter-secondary dark:text-twitter-secondary-dark">
          You&apos;ve reached the end
        </div>
      )}
    </div>
  );
}
