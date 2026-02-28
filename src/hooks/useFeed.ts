"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { FeedTabType } from "@/components/feed/FeedTabs";

export interface FeedTweet {
  id: string;
  content: string;
  createdAt: Date | string;
  views: number;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
    verified: boolean;
  };
  media: {
    id: string;
    type: "image" | "video";
    url: string;
    thumbnail?: string;
  }[];
  replies: number;
  retweets: number;
  likes: number;
  bookmarks?: number;
  isLiked: boolean;
  isRetweeted: boolean;
  isBookmarked: boolean;
  retweetOf?: {
    id: string;
    content: string;
    user: {
      id: string;
      name: string;
      username: string;
      avatar: string | null;
      verified: boolean;
    };
    media: {
      id: string;
      type: "image" | "video";
      url: string;
      thumbnail?: string;
    }[];
    replies: number;
    retweets: number;
    likes: number;
  } | null;
  inReplyTo?: {
    id: string;
    username: string;
  } | null;
}

interface FeedResponse {
  tweets: FeedTweet[];
  nextCursor: string | null;
}

interface UseFeedOptions {
  type: FeedTabType;
  limit?: number;
  enabled?: boolean;
}

export function useFeed({ type, limit = 10, enabled = true }: UseFeedOptions) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const fetchFeed = async ({ pageParam }: { pageParam?: string }): Promise<FeedResponse> => {
    const params = new URLSearchParams({
      type,
      limit: limit.toString(),
    });

    if (pageParam) {
      params.append("cursor", pageParam);
    }

    const response = await fetch(`/api/feed?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Failed to fetch feed");
    }

    return response.json();
  };

  const query = useInfiniteQuery({
    queryKey: ["feed", type],
    queryFn: fetchFeed,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  const tweets = query.data?.pages.flatMap((page) => page.tweets) ?? [];

  const prefetchNextPage = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      queryClient.prefetchInfiniteQuery({
        queryKey: ["feed", type],
        queryFn: fetchFeed,
        initialPageParam: query.data?.pages[query.data.pages.length - 1]?.nextCursor,
        pages: 1,
      });
    }
  };

  const invalidateFeed = () => {
    queryClient.invalidateQueries({ queryKey: ["feed"] });
  };

  const refetchFeed = () => {
    query.refetch();
  };

  return {
    tweets,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    prefetchNextPage,
    invalidateFeed,
    refetchFeed,
    error: query.error,
    isAuthenticated,
  };
}
