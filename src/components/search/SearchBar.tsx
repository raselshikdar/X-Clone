"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Clock, Trash2, Hash, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/common/Avatar";
import { CheckCircle2 } from "lucide-react";

interface SuggestionUser {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  verified: boolean;
}

interface SuggestionHashtag {
  id: string;
  name: string;
  tweetCount: number;
}

interface RecentSearch {
  query: string;
  type: "text" | "user" | "hashtag";
  timestamp: number;
}

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
  showSuggestions?: boolean;
  showRecent?: boolean;
}

const RECENT_SEARCHES_KEY = "twitter_recent_searches";

export function SearchBar({
  className,
  placeholder = "Search",
  autoFocus = false,
  onSearch,
  showSuggestions = true,
  showRecent = true,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<RecentSearch[]>([]);
  const [suggestions, setSuggestions] = React.useState<{
    users: SuggestionUser[];
    hashtags: SuggestionHashtag[];
  }>({ users: [], hashtags: [] });
  const [isLoadingSuggestions, setIsLoadingSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  React.useEffect(() => {
    if (showRecent) {
      try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        if (stored) {
          setRecentSearches(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load recent searches:", e);
      }
    }
  }, [showRecent]);

  // Fetch suggestions when query changes
  React.useEffect(() => {
    if (!showSuggestions || query.length < 2) {
      setSuggestions({ users: [], hashtags: [] });
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=3`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions({
            users: data.users || [],
            hashtags: data.hashtags || [],
          });
        }
      } catch (e) {
        console.error("Failed to fetch suggestions:", e);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 200);
    return () => clearTimeout(debounce);
  }, [query, showSuggestions]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveRecentSearch = (searchQuery: string, type: "text" | "user" | "hashtag" = "text") => {
    if (!showRecent || !searchQuery.trim()) return;

    const newSearch: RecentSearch = {
      query: searchQuery,
      type,
      timestamp: Date.now(),
    };

    const updated = [
      newSearch,
      ...recentSearches.filter((s) => s.query !== searchQuery),
    ].slice(0, 10);

    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save recent search:", e);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.error("Failed to clear recent searches:", e);
    }
  };

  const removeRecentSearch = (searchQuery: string) => {
    const updated = recentSearches.filter((s) => s.query !== searchQuery);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to remove recent search:", e);
    }
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    saveRecentSearch(finalQuery);
    setIsFocused(false);

    if (onSearch) {
      onSearch(finalQuery);
    } else {
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const hasSuggestions = suggestions.users.length > 0 || suggestions.hashtags.length > 0;
  const showDropdown = isFocused && (showRecent || hasSuggestions || isLoadingSuggestions);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Search Input */}
      <div
        className={cn(
          "relative flex items-center",
          "rounded-full",
          isFocused
            ? "bg-black ring-1 ring-twitter-blue"
            : "bg-[#202327]"
        )}
      >
        <Search
          className={cn(
            "absolute left-4 size-5",
            isFocused
              ? "text-twitter-blue"
              : "text-gray-500"
          )}
        />
        <Input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={cn(
            "h-[42px] pl-12 pr-10",
            "border-none rounded-full",
            "text-[15px] text-white",
            "placeholder:text-gray-500",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "bg-transparent"
          )}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 size-7 rounded-full hover:bg-twitter-blue/10 text-gray-500"
            onClick={() => setQuery("")}
          >
            <X className="size-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          className={cn(
            "absolute top-full left-0 right-0 mt-1",
            "bg-black",
            "rounded-2xl shadow-lg",
            "overflow-hidden",
            "z-50",
            "max-h-[400px] overflow-y-auto",
            "border border-twitter-border-dark"
          )}
        >
          {/* Loading */}
          {isLoadingSuggestions && (
            <div className="p-4">
              <Skeleton className="h-8 w-full mb-2 bg-gray-800" />
              <Skeleton className="h-8 w-full bg-gray-800" />
            </div>
          )}

          {/* Suggestions */}
          {!isLoadingSuggestions && hasSuggestions && (
            <>
              {/* User suggestions */}
              {suggestions.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[13px] font-bold text-gray-500">
                    People
                  </div>
                  {suggestions.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/${user.username}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        "hover:bg-twitter-hover-dark",
                        "transition-colors"
                      )}
                      onClick={() => {
                        saveRecentSearch(`@${user.username}`, "user");
                        setIsFocused(false);
                      }}
                    >
                      <UserAvatar
                        src={user.avatar}
                        alt={user.name}
                        fallback={user.name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[15px] truncate text-white">
                            {user.name}
                          </span>
                          {user.verified && (
                            <CheckCircle2 className="size-[18px] text-twitter-blue fill-twitter-blue" />
                          )}
                        </div>
                        <div className="text-[13px] text-gray-500 truncate">
                          @{user.username}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Hashtag suggestions */}
              {suggestions.hashtags.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-[13px] font-bold text-gray-500">
                    Trends
                  </div>
                  {suggestions.hashtags.map((hashtag) => (
                    <Link
                      key={hashtag.id}
                      href={`/hashtag/${encodeURIComponent(hashtag.name.replace("#", ""))}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3",
                        "hover:bg-twitter-hover-dark",
                        "transition-colors"
                      )}
                      onClick={() => {
                        saveRecentSearch(hashtag.name, "hashtag");
                        setIsFocused(false);
                      }}
                    >
                      <div
                        className={cn(
                          "size-9 rounded-full",
                          "bg-[#202327]",
                          "flex items-center justify-center"
                        )}
                      >
                        <Hash className="size-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-bold text-[15px] text-white">{hashtag.name}</div>
                        <div className="text-[13px] text-gray-500">
                          {hashtag.tweetCount.toLocaleString()} posts
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Search for query */}
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3",
                  "hover:bg-twitter-hover-dark",
                  "transition-colors text-left"
                )}
                onClick={() => handleSearch()}
              >
                <Search className="size-5 text-gray-500" />
                <span className="text-[15px] text-white">
                  Search for <strong>{query}</strong>
                </span>
              </button>
            </>
          )}

          {/* Recent searches */}
          {!isLoadingSuggestions && !hasSuggestions && showRecent && recentSearches.length > 0 && (
            <>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-bold text-[15px] text-white">Recent</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-twitter-blue hover:text-twitter-blue hover:bg-twitter-blue/10 -mr-2"
                  onClick={clearRecentSearches}
                >
                  Clear all
                </Button>
              </div>
              {recentSearches.slice(0, 5).map((search) => (
                <div
                  key={search.query}
                  className={cn(
                    "flex items-center justify-between",
                    "px-4 py-3",
                    "hover:bg-twitter-hover-dark",
                    "transition-colors"
                  )}
                >
                  <button
                    className="flex items-center gap-3 flex-1 text-left"
                    onClick={() => {
                      setQuery(search.query);
                      handleSearch(search.query);
                    }}
                  >
                    <div
                      className={cn(
                        "size-9 rounded-full",
                        "bg-[#202327]",
                        "flex items-center justify-center"
                      )}
                    >
                      {search.type === "user" ? (
                        <Search className="size-4 text-gray-500" />
                      ) : search.type === "hashtag" ? (
                        <TrendingUp className="size-4 text-gray-500" />
                      ) : (
                        <Clock className="size-4 text-gray-500" />
                      )}
                    </div>
                    <span className="text-[15px] text-white">{search.query}</span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full hover:bg-twitter-blue/10 text-gray-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentSearch(search.query);
                    }}
                  >
                    <X className="size-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
