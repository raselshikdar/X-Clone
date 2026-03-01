"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { SearchBar } from "@/components/search/SearchBar";
import { TrendingSidebar } from "@/components/trending/TrendingSidebar";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/Avatar";

type ExploreTab = "for-you" | "trending" | "news" | "sports" | "entertainment";

// Inner component that safely uses useSearchParams — must be inside <Suspense>
function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ExploreTab) || "for-you";
  const [activeTab, setActiveTab] = React.useState<ExploreTab>(initialTab);

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleTabChange = (tab: ExploreTab) => {
    setActiveTab(tab);
    router.push(`/explore?tab=${tab}`, { scroll: false });
  };

  const tabs: { id: ExploreTab; label: string }[] = [
    { id: "for-you", label: "For you" },
    { id: "trending", label: "Trending" },
    { id: "news", label: "News" },
    { id: "sports", label: "Sports" },
    { id: "entertainment", label: "Entertainment" },
  ];

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-20 border-b border-[#2f3336]">
        {/* Search bar */}
        <div className="px-4 py-3">
          <SearchBar
            placeholder="Search"
            onSearch={handleSearch}
            showSuggestions={true}
            showRecent={true}
          />
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex-1 min-w-[80px] py-4 px-4",
                "font-bold text-[15px]",
                "text-center",
                "transition-colors",
                "hover:bg-white/5",
                activeTab === tab.id ? "text-white" : "text-[#71767b]"
              )}
            >
              <span className="relative">
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-[#1d9bf0]" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content based on tab */}
      <div className="pb-4">
        {activeTab === "for-you" && (
          <>
            <TrendingSidebar
              showHeader={true}
              showMore={false}
              limit={10}
              className="rounded-none bg-transparent"
            />
            <WhoToFollowSection />
          </>
        )}

        {activeTab === "trending" && (
          <TrendingSidebar
            showHeader={true}
            showMore={false}
            limit={20}
            className="rounded-none bg-transparent"
          />
        )}

        {activeTab === "news" && <CategorySection category="news" title="News" />}
        {activeTab === "sports" && <CategorySection category="sports" title="Sports" />}
        {activeTab === "entertainment" && (
          <CategorySection category="entertainment" title="Entertainment" />
        )}
      </div>
    </>
  );
}

export default function ExplorePage() {
  return (
    <MainLayout>
      <React.Suspense
        fallback={
          <div className="p-4 space-y-3 animate-pulse">
            <div className="h-10 rounded-full bg-[#2f3336]" />
            <div className="h-12 rounded bg-[#2f3336]" />
          </div>
        }
      >
        <ExploreContent />
      </React.Suspense>
    </MainLayout>
  );
}

function WhoToFollowSection() {
  const [users, setUsers] = React.useState<
    Array<{
      id: string;
      username: string;
      displayName: string | null;
      avatar: string | null;
      verified: boolean;
      bio: string | null;
      _count: { followers: number };
    }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/search/users?q=&limit=3");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (e) {
        console.error("Failed to fetch users:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading || users.length === 0) return null;

  return (
    <div className="bg-[#16181c] rounded-2xl mx-4 mt-4">
      <h2 className="font-bold text-xl px-4 pt-4 text-white">Who to follow</h2>
      <div className="mt-2">
        {users.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className={cn(
              "flex items-center justify-between",
              "px-4 py-3",
              "hover:bg-white/5",
              "transition-colors"
            )}
          >
            <a
              href={`/${user.username}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <UserAvatar
                src={user.avatar}
                alt={user.displayName || user.username}
                fallback={user.displayName || user.username}
                size="md"
              />
              <div className="min-w-0">
                <div className="font-bold text-[15px] truncate text-white">
                  {user.displayName || user.username}
                </div>
                <div className="text-[13px] text-[#71767b] truncate">
                  @{user.username}
                </div>
              </div>
            </a>
            <Button className="bg-white text-black rounded-full font-bold h-8 px-4 text-[15px] hover:bg-gray-200">
              Follow
            </Button>
          </div>
        ))}
      </div>
      <a
        href="/explore"
        className="block px-4 py-3 text-[#1d9bf0] hover:bg-white/5 transition-colors"
      >
        Show more
      </a>
    </div>
  );
}

function CategorySection({ category, title }: { category: string; title: string }) {
  return (
    <div className="p-4">
      <TrendingSidebar
        showHeader={false}
        showMore={false}
        limit={10}
        className="rounded-none bg-transparent"
      />
    </div>
  );
}


function WhoToFollowSection() {
  const [users, setUsers] = React.useState<Array<{
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
    bio: string | null;
    _count: { followers: number };
  }>>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/search/users?q=&limit=3");
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (e) {
        console.error("Failed to fetch users:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading || users.length === 0) return null;

  return (
    <div className="bg-[#16181c] rounded-2xl mx-4 mt-4">
      <h2 className="font-bold text-xl px-4 pt-4 text-white">Who to follow</h2>
      <div className="mt-2">
        {users.slice(0, 3).map((user) => (
          <div
            key={user.id}
            className={cn(
              "flex items-center justify-between",
              "px-4 py-3",
              "hover:bg-twitter-hover-dark",
              "transition-colors"
            )}
          >
            <a
              href={`/${user.username}`}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <UserAvatar
                src={user.avatar}
                alt={user.displayName || user.username}
                fallback={user.displayName || user.username}
                size="md"
              />
              <div className="min-w-0">
                <div className="font-bold text-[15px] truncate text-white">
                  {user.displayName || user.username}
                </div>
                <div className="text-[13px] text-gray-500 truncate">
                  @{user.username}
                </div>
              </div>
            </a>
            <Button
              className="bg-white text-black rounded-full font-bold h-8 px-4 text-[15px] hover:bg-gray-200"
            >
              Follow
            </Button>
          </div>
        ))}
      </div>
      <a
        href="/explore"
        className="block px-4 py-3 text-twitter-blue hover:bg-twitter-hover-dark transition-colors"
      >
        Show more
      </a>
    </div>
  );
}

function CategorySection({ category, title }: { category: string; title: string }) {
  return (
    <div className="p-4">
      <TrendingSidebar
        showHeader={false}
        showMore={false}
        limit={10}
        className="rounded-none bg-transparent"
      />
    </div>
  );
}
