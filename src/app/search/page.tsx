"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchFilters } from "@/components/search/SearchFilters";
import { MainLayout } from "@/components/layout/MainLayout";

// Inner component that uses useSearchParams — must be inside <Suspense>
function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = React.useState(initialQuery);
  const [filters, setFilters] = React.useState<Record<string, unknown>>({});

  React.useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams]);

  const buildSearchQuery = React.useCallback(
    (baseQuery: string, searchFilters: Record<string, unknown>) => {
      let q = baseQuery;
      if (searchFilters.from) q += ` from:${searchFilters.from}`;
      if (searchFilters.to) q += ` to:${searchFilters.to}`;
      if (searchFilters.hashtag) q += ` #${searchFilters.hashtag}`;
      if (searchFilters.hasMedia) q += " has:media";
      if (searchFilters.hasImages) q += " has:images";
      if (searchFilters.hasVideos) q += " has:videos";
      if (searchFilters.since) {
        const date = new Date(searchFilters.since as Date);
        q += ` since:${date.toISOString().split("T")[0]}`;
      }
      if (searchFilters.until) {
        const date = new Date(searchFilters.until as Date);
        q += ` until:${date.toISOString().split("T")[0]}`;
      }
      return q.trim();
    },
    []
  );

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
    <div className="max-w-[600px] mx-auto">
      {/* Header with search bar */}
      <div className="sticky top-0 bg-black/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 px-2 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-white hover:bg-white/10"
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
        <div className="px-4 py-2 border-b border-[#2f3336]">
          <SearchFilters onFilterChange={handleFilterChange} />
        </div>
      )}

      {/* Results */}
      {query ? (
        <SearchResults query={query} />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <h2 className="text-2xl font-bold mb-2 text-white">Search X</h2>
          <p className="text-[#71767b] text-center max-w-xs">
            Find people, topics, and posts that matter to you.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <MainLayout showRightSidebar={false}>
      <React.Suspense
        fallback={
          <div className="p-4 space-y-3 animate-pulse">
            <div className="h-10 rounded-full bg-[#2f3336]" />
            <div className="h-12 rounded bg-[#2f3336]" />
          </div>
        }
      >
        <SearchContent />
      </React.Suspense>
    </MainLayout>
  );
}
