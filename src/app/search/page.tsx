"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchFilters } from "@/components/search/SearchFilters";
import { MainLayout } from "@/components/layout/MainLayout";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = React.useState(initialQuery);
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});

  // Update query when URL changes
  React.useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams]);

  // Build search query with filters
  const buildSearchQuery = React.useCallback((baseQuery: string, searchFilters: Record<string, unknown>) => {
    let q = baseQuery;

    if (searchFilters.from) {
      q += ` from:${searchFilters.from}`;
    }
    if (searchFilters.to) {
      q += ` to:${searchFilters.to}`;
    }
    if (searchFilters.hashtag) {
      q += ` #${searchFilters.hashtag}`;
    }
    if (searchFilters.hasMedia) {
      q += " has:media";
    }
    if (searchFilters.hasImages) {
      q += " has:images";
    }
    if (searchFilters.hasVideos) {
      q += " has:videos";
    }
    if (searchFilters.since) {
      const date = new Date(searchFilters.since as Date);
      q += ` since:${date.toISOString().split("T")[0]}`;
    }
    if (searchFilters.until) {
      const date = new Date(searchFilters.until as Date);
      q += ` until:${date.toISOString().split("T")[0]}`;
    }

    return q.trim();
  }, []);

  const handleSearch = (newQuery: string) => {
    const finalQuery = buildSearchQuery(newQuery, filters);
    router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
  };

  const handleFilterChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters);
    if (query) {
      const finalQuery = buildSearchQuery(query.split(" ")[0], newFilters);
      router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
    }
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-[600px] mx-auto">
        {/* Header with search bar */}
        <div className="sticky top-0 bg-black/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-2 px-2 py-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-twitter-hover-dark"
              onClick={() => router.back()}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex-1">
              <SearchBar
                placeholder="Search"
                autoFocus={!initialQuery}
                onSearch={handleSearch}
                showSuggestions={true}
                showRecent={true}
              />
            </div>
          </div>
        </div>

        {/* Filters bar */}
        {query && (
          <div className="px-4 py-2 border-b border-twitter-border-dark">
            <SearchFilters onFilterChange={handleFilterChange} />
          </div>
        )}

        {/* Results */}
        {query ? (
          <SearchResults query={query} />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <h2 className="text-2xl font-bold mb-2 text-white">Search X</h2>
            <p className="text-twitter-secondary-dark text-center max-w-xs">
              Find people, topics, and posts that matter to you.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
