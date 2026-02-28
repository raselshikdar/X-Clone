"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/useAuth";

interface NewTweetNotification {
  id: string;
  count: number;
}

interface UseRealtimeFeedOptions {
  onNewTweet?: () => void;
  enabled?: boolean;
}

interface UseRealtimeFeedReturn {
  newTweetsCount: number;
  showNewTweetsButton: boolean;
  handleShowNewTweets: () => void;
  isConnected: boolean;
}

export function useRealtimeFeed({
  onNewTweet,
  enabled = true,
}: UseRealtimeFeedOptions = {}): UseRealtimeFeedReturn {
  const { isAuthenticated } = useAuth();
  const [newTweetsCount, setNewTweetsCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      return;
    }

    // Connect to WebSocket server
    // Note: Using the same port pattern as the websocket example
    const socketInstance = io("/?XTransformPort=3003", {
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Real-time feed connected");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Real-time feed disconnected");
    });

    // Listen for new tweet notifications
    socketInstance.on("new-tweet", (data: NewTweetNotification) => {
      setNewTweetsCount((prev) => prev + (data.count || 1));
      onNewTweet?.();
    });

    socketInstance.on("error", (error: Error) => {
      console.error("Socket error:", error);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [enabled, isAuthenticated, onNewTweet]);

  const handleShowNewTweets = useCallback(() => {
    setNewTweetsCount(0);
    onNewTweet?.();
  }, [onNewTweet]);

  return {
    newTweetsCount,
    showNewTweetsButton: newTweetsCount > 0,
    handleShowNewTweets,
    isConnected,
  };
}

// Hook for polling-based real-time updates as fallback
export function useFeedPolling(
  callback: () => void,
  options: {
    interval?: number;
    enabled?: boolean;
  } = {}
) {
  const { interval = 60000, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(callback, interval);

    return () => clearInterval(intervalId);
  }, [callback, interval, enabled]);
}
