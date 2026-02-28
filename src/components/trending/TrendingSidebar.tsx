"use client";

import * as React from "react";
import Link from "next/link";
import { TrendingItem, type TrendingItemData } from "./TrendingItem";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingSidebarProps {
  className?: string;
  limit?: number;
  showHeader?: boolean;
  showMore?: boolean;
}

export function TrendingSidebar({
  className,
  limit = 5,
  showHeader = true,
  showMore = true,
}: TrendingSidebarProps) {
  const [trends, setTrends] = React.useState<TrendingItemData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchTrends = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/trending?limit=${limit}`);
        if (!response.ok) {
          throw new Error("Failed to fetch trending topics");
        }
        const data = await response.json();
        setTrends(data.trends);
      } catch (err) {
        console.error("Failed to fetch trending:", err);
        setError("Failed to load trending topics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [limit]);

  return (
    <div
      className={cn(
        "rounded-2xl bg-[#16181c] overflow-hidden",
        className
      )}
    >
      {showHeader && (
        <h2 className="font-bold text-xl px-4 pt-4 text-white">What&apos;s happening</h2>
      )}
      <div className="mt-2">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="px-4 py-3">
              <Skeleton className="h-3 w-24 mb-1 bg-gray-800" />
              <Skeleton className="h-4 w-32 mb-1 bg-gray-800" />
              <Skeleton className="h-3 w-16 bg-gray-800" />
            </div>
          ))
        ) : error ? (
          <div className="px-4 py-6 text-center text-gray-500">
            {error}
          </div>
        ) : trends.length === 0 ? (
          <div className="px-4 py-6 text-center text-gray-500">
            No trending topics right now
          </div>
        ) : (
          trends.map((trend) => <TrendingItem key={trend.id} item={trend} />)
        )}
      </div>
      {showMore && (
        <Link
          href="/explore"
          className="block px-4 py-3 text-twitter-blue hover:bg-twitter-hover-dark transition-colors duration-200"
        >
          Show more
        </Link>
      )}
    </div>
  );
}
