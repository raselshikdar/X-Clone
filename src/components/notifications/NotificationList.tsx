"use client";

import * as React from "react";
import { BellOff, Check } from "lucide-react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { NotificationItem, Notification } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface NotificationListResponse {
  notifications: Notification[];
  nextCursor: string | undefined;
  unreadCount: number;
}

async function fetchNotifications({
  type,
  cursor,
}: {
  type: string;
  cursor?: string;
}): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  if (type !== "all") {
    params.set("type", type);
  }
  if (cursor) {
    params.set("cursor", cursor);
  }

  const response = await fetch(`/api/notifications?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }
  return response.json();
}

async function markAsRead(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to mark notification as read");
  }
}

async function markAllAsRead(): Promise<{ count: number }> {
  const response = await fetch("/api/notifications/read-all", {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to mark all notifications as read");
  }
  return response.json();
}

interface NotificationListProps {
  type?: string;
  showMarkAllRead?: boolean;
}

export function NotificationList({
  type = "all",
  showMarkAllRead = true,
}: NotificationListProps) {
  const queryClient = useQueryClient();
  const observerRef = React.useRef<IntersectionObserver | null>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  // Infinite query for notifications
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["notifications", type],
    queryFn: ({ pageParam }) =>
      fetchNotifications({ type, cursor: pageParam as string | undefined }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });

  // Infinite scroll observer
  React.useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all notifications from pages
  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  // Loading skeleton
  if (isLoading) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 px-4 py-3 border-b border-twitter-border dark:border-twitter-border-dark"
          >
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <p className="text-twitter-secondary dark:text-twitter-secondary-dark mb-4">
          {error instanceof Error ? error.message : "Something went wrong"}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <BellOff className="size-12 text-twitter-secondary dark:text-twitter-secondary-dark mb-4" />
        <h3 className="text-xl font-bold mb-2">No notifications yet</h3>
        <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-center">
          {type === "mentions"
            ? "When someone mentions you, it'll show up here."
            : "When you have notifications, they'll show up here."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Mark all as read button */}
      {showMarkAllRead && unreadCount > 0 && (
        <div className="sticky top-0 z-10 bg-white dark:bg-black border-b border-twitter-border dark:border-twitter-border-dark px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-twitter-blue hover:bg-twitter-blue/10"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Check className="size-4 mr-2" />
            Mark all as read ({unreadCount})
          </Button>
        </div>
      )}

      {/* Notification items */}
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
        />
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="h-4">
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-twitter-blue border-t-transparent" />
          </div>
        )}
      </div>

      {/* End of list */}
      {!hasNextPage && notifications.length > 0 && (
        <div className="text-center py-8 text-twitter-secondary dark:text-twitter-secondary-dark text-sm">
          You've reached the end
        </div>
      )}
    </div>
  );
}
