"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton({ count = 3 }: LoadingSkeletonProps) {
  return (
    <div className="divide-y divide-twitter-border-dark">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-3 px-4 py-3",
            "animate-pulse"
          )}
        >
          {/* Avatar skeleton */}
          <Skeleton className="size-10 rounded-full shrink-0 bg-gray-800" />

          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            {/* Header skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24 rounded bg-gray-800" />
              <Skeleton className="h-4 w-16 rounded bg-gray-800" />
              <Skeleton className="h-3 w-10 rounded bg-gray-800" />
            </div>

            {/* Text skeleton */}
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full rounded bg-gray-800" />
              <Skeleton className="h-4 w-3/4 rounded bg-gray-800" />
            </div>

            {/* Media skeleton */}
            {i % 2 === 0 && (
              <Skeleton className="h-48 w-full rounded-2xl mt-2 bg-gray-800" />
            )}

            {/* Actions skeleton */}
            <div className="flex items-center justify-between pt-3 gap-4">
              <Skeleton className="h-4 w-12 rounded bg-gray-800" />
              <Skeleton className="h-4 w-12 rounded bg-gray-800" />
              <Skeleton className="h-4 w-12 rounded bg-gray-800" />
              <Skeleton className="h-4 w-12 rounded bg-gray-800" />
              <Skeleton className="h-4 w-8 rounded bg-gray-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
