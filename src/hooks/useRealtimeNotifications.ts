"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export interface RealtimeNotification {
  id: string;
  type: "like" | "retweet" | "follow" | "mention" | "reply" | "quote";
  read: boolean;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
    verified?: boolean;
  };
  tweet?: {
    id: string;
    content: string | null;
    author: {
      id: string;
      username: string;
      name: string;
    };
  } | null;
}

interface UseRealtimeNotificationsOptions {
  userId?: string;
  enabled?: boolean;
  pollingInterval?: number;
  onNewNotification?: (notification: RealtimeNotification) => void;
}

export function useRealtimeNotifications({
  userId,
  enabled = true,
  pollingInterval = 30000, // 30 seconds
  onNewNotification,
}: UseRealtimeNotificationsOptions) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get notification text for toast
  const getNotificationText = useCallback((notification: RealtimeNotification): string => {
    const actorName = notification.actor.name;

    switch (notification.type) {
      case "like":
        return `${actorName} liked your post`;
      case "retweet":
        return `${actorName} reposted your post`;
      case "follow":
        return `${actorName} followed you`;
      case "mention":
        return `${actorName} mentioned you in a post`;
      case "reply":
        return `${actorName} replied to your post`;
      case "quote":
        return `${actorName} quoted your post`;
      default:
        return "New notification";
    }
  }, []);

  // Handle new notification
  const handleNewNotification = useCallback(
    (notification: RealtimeNotification) => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ["notifications"] });

      // Update unread count
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      toast(getNotificationText(notification), {
        description: notification.tweet?.content
          ? notification.tweet.content.slice(0, 100) + (notification.tweet.content.length > 100 ? "..." : "")
          : undefined,
        action: notification.tweet
          ? {
              label: "View",
              onClick: () => {
                window.location.href = `/tweet/${notification.tweet!.id}`;
              },
            }
          : notification.type === "follow"
          ? {
              label: "View profile",
              onClick: () => {
                window.location.href = `/profile/${notification.actor.username}`;
              },
            }
          : undefined,
      });

      // Call custom handler if provided
      onNewNotification?.(notification);
    },
    [queryClient, getNotificationText, onNewNotification]
  );

  // WebSocket connection
  useEffect(() => {
    if (!userId || !enabled) return;

    // Try to connect via WebSocket
    try {
      const socketInstance = io("/?XTransformPort=3002", {
        transports: ["websocket", "polling"],
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000,
      });

      socketRef.current = socketInstance;

      socketInstance.on("connect", () => {
        console.log("[Notifications] WebSocket connected");
        setIsConnected(true);

        // Join notification room
        socketInstance.emit("join-notifications", { userId });
      });

      socketInstance.on("disconnect", () => {
        console.log("[Notifications] WebSocket disconnected");
        setIsConnected(false);
      });

      // Handle new notification event
      socketInstance.on("notification", (notification: RealtimeNotification) => {
        console.log("[Notifications] New notification:", notification);
        handleNewNotification(notification);
      });

      // Handle unread count update
      socketInstance.on("unread-count", (data: { count: number }) => {
        setUnreadCount(data.count);
        queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      });

      return () => {
        socketInstance.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      };
    } catch (error) {
      console.error("[Notifications] WebSocket error:", error);
    }
  }, [userId, enabled, handleNewNotification, queryClient]);

  // Polling fallback
  useEffect(() => {
    if (!userId || !enabled || isConnected) return;

    // Fetch initial unread count
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications?limit=1");
        if (response.ok) {
          const data = await response.json();
          const newCount = data.unreadCount ?? 0;

          // If count increased, we have new notifications
          if (newCount > unreadCount) {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }

          setUnreadCount(newCount);
        }
      } catch (error) {
        console.error("[Notifications] Polling error:", error);
      }
    };

    fetchUnreadCount();

    // Set up polling interval
    pollingIntervalRef.current = setInterval(fetchUnreadCount, pollingInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [userId, enabled, isConnected, pollingInterval, unreadCount, queryClient]);

  // Mark notifications as read
  const markAsRead = useCallback(
    async (notificationIds?: string[]) => {
      try {
        if (notificationIds && notificationIds.length === 1) {
          // Mark single notification as read
          await fetch(`/api/notifications/${notificationIds[0]}/read`, {
            method: "POST",
          });
        } else if (notificationIds && notificationIds.length > 1) {
          // Mark multiple notifications as read
          await fetch("/api/notifications", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ notificationIds }),
          });
        } else {
          // Mark all as read
          await fetch("/api/notifications/read-all", {
            method: "POST",
          });
        }

        // Update local state
        setUnreadCount(0);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      } catch (error) {
        console.error("[Notifications] Error marking as read:", error);
      }
    },
    [queryClient]
  );

  // Refresh notifications
  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  return {
    isConnected,
    unreadCount,
    markAsRead,
    refresh,
  };
}
