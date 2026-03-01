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

                <div className="space-y-3">
                  {/* Google sign-up */}
                  <button
                    onClick={() => {
                      setAuthView("signup");
                      setAuthModalOpen(true);
                    }}
                    className="w-full h-10 flex items-center justify-center gap-3 rounded-full bg-white hover:bg-gray-100 transition-colors font-semibold text-[15px] text-black"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </button>

                  {/* Apple sign-up */}
                  <button
                    onClick={() => {
                      setAuthView("signup");
                      setAuthModalOpen(true);
                    }}
                    className="w-full h-10 flex items-center justify-center gap-3 rounded-full bg-white hover:bg-gray-100 transition-colors font-semibold text-[15px] text-black"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="black">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    Sign up with Apple
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-[#2f3336]" />
                    <span className="text-[15px] text-gray-500">or</span>
                    <div className="flex-1 h-px bg-[#2f3336]" />
                  </div>

                  {/* Create account */}
                  <Button
                    onClick={() => {
                      setAuthView("signup");
                      setAuthModalOpen(true);
                    }}
                    className="w-full h-10 bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white rounded-full font-bold text-[15px]"
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
