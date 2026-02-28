"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { FeedTabs, type FeedTabType } from "@/components/feed/FeedTabs";
import { LoadingSkeleton } from "@/components/feed/LoadingSkeleton";
import { EmptyFeed } from "@/components/feed/EmptyFeed";
import { FeedTweet } from "@/components/feed/FeedTweet";
import { TweetComposer } from "@/components/tweet/TweetComposer";
import { LiveBanner } from "@/components/feed/LiveBanner";
import { useFeed } from "@/hooks/useFeed";
import { AuthModal } from "@/components/auth/AuthModal";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTabType>("forYou");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup">("login");

  const {
    tweets,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    prefetchNextPage,
    refetchFeed,
    error,
  } = useFeed({
    type: activeTab,
    enabled: isAuthenticated,
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

  // Handle like/retweet/bookmark actions - these receive the current state from TweetCard
  const handleLike = useCallback(async (id: string, isCurrentlyLiked: boolean) => {
    try {
      const method = isCurrentlyLiked ? "DELETE" : "POST";
      await fetch(`/api/tweets/${id}/like`, { method });
    } catch (error) {
      console.error("Failed to like tweet:", error);
    }
  }, []);

  const handleRetweet = useCallback(async (id: string, isCurrentlyRetweeted: boolean) => {
    try {
      const method = isCurrentlyRetweeted ? "DELETE" : "POST";
      await fetch(`/api/tweets/${id}/retweet`, { method });
    } catch (error) {
      console.error("Failed to retweet:", error);
    }
  }, []);

  const handleBookmark = useCallback(async (id: string, isCurrentlyBookmarked: boolean) => {
    try {
      const method = isCurrentlyBookmarked ? "DELETE" : "POST";
      await fetch(`/api/tweets/${id}/bookmark`, { method });
    } catch (error) {
      console.error("Failed to bookmark tweet:", error);
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/tweets/${id}`, { method: "DELETE" });
        refetchFeed();
      } catch (error) {
        console.error("Failed to delete tweet:", error);
      }
    },
    [refetchFeed]
  );

  const handleTabChange = (tab: FeedTabType) => {
    setActiveTab(tab);
  };

  // Loading state for auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="size-10 border-2 border-twitter-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated - show landing page
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-black flex flex-col">
          {/* Mobile Header */}
          <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-[53px] flex items-center justify-between px-4 bg-black border-b border-twitter-border-dark">
            <div className="w-8 h-8" />
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <Button
              variant="outline"
              className="rounded-full border-white text-white hover:bg-white/10 px-4 py-1.5 h-8 text-sm font-semibold"
              onClick={() => {
                setAuthView("signup");
                setAuthModalOpen(true);
              }}
            >
              Subscribe
            </Button>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col lg:flex-row mt-[53px] lg:mt-0">
            {/* Left side - Hero section */}
            <div className="hidden lg:flex lg:flex-1 bg-black items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-[380px] w-[380px] fill-white">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>

            {/* Right side - CTA */}
            <div className="flex-1 flex items-center justify-center p-8 bg-black">
              <div className="w-full max-w-md">
                {/* Mobile logo */}
                <div className="lg:hidden mb-8 flex justify-center">
                  <svg viewBox="0 0 24 24" className="h-12 w-12 fill-white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>

                <h1 className="text-4xl lg:text-6xl font-bold mb-8 text-white">
                  Happening now
                </h1>

                <h2 className="text-2xl lg:text-3xl font-bold mb-8 text-white">
                  Join today.
                </h2>

                <div className="space-y-4">
                  <Button
                    onClick={() => {
                      setAuthView("signup");
                      setAuthModalOpen(true);
                    }}
                    className="w-full h-12 bg-white hover:bg-gray-200 text-black rounded-full font-bold text-base"
                  >
                    Create account
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By signing up, you agree to the{" "}
                    <a href="#" className="text-twitter-blue hover:underline">
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-twitter-blue hover:underline">
                      Privacy Policy
                    </a>
                    , including{" "}
                    <a href="#" className="text-twitter-blue hover:underline">
                      Cookie Use
                    </a>
                    .
                  </p>
                </div>

                <div className="mt-10">
                  <p className="text-lg font-semibold mb-4 text-white">
                    Already have an account?
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAuthView("login");
                      setAuthModalOpen(true);
                    }}
                    className="w-full h-12 rounded-full font-bold text-twitter-blue border-twitter-blue hover:bg-twitter-blue/10"
                  >
                    Sign in
                  </Button>
                </div>
              </div>
            </div>
          </main>

          {/* Footer */}
          <footer className="bg-black border-t border-twitter-border-dark py-4 px-4">
            <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-gray-500">
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Cookie Policy</a>
              <a href="#" className="hover:underline">Accessibility</a>
              <a href="#" className="hover:underline">Ads info</a>
              <a href="#" className="hover:underline">More</a>
              <span>© 2026 X Corp.</span>
            </nav>
          </footer>
        </div>

        <AuthModal
          open={authModalOpen}
          onOpenChange={setAuthModalOpen}
          defaultView={authView}
        />
      </>
    );
  }

  // Authenticated - show feed
  return (
    <MainLayout onTweetPosted={refetchFeed}>
      <div onMouseEnter={handleMouseEnter}>
        {/* Feed tabs */}
        <FeedTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isLoading={isLoading}
        />

        {/* Tweet composer */}
        <TweetComposer onTweetPosted={refetchFeed} />

        {/* Live broadcasts banner */}
        <LiveBanner />

        {/* Feed content */}
        {isLoading ? (
          <LoadingSkeleton count={5} />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <p className="text-red-500 mb-4">Failed to load feed</p>
            <Button onClick={() => refetchFeed()} variant="outline">
              Try again
            </Button>
          </div>
        ) : tweets.length === 0 ? (
          <EmptyFeed type={activeTab} isAuthenticated={isAuthenticated} />
        ) : (
          <div className="divide-y divide-twitter-border-dark">
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
          <div className="py-8 text-center text-gray-500">
            You&apos;ve reached the end
          </div>
        )}
      </div>
    </MainLayout>
  );
}
