"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface UseWebSocketOptions {
  userId?: string;
  username?: string;
  onMessage?: (data: { message: DirectMessage; senderId: string }) => void;
  onMessageSent?: (data: { message: DirectMessage }) => void;
  onTyping?: (data: { senderId: string; conversationId: string; isTyping: boolean }) => void;
  onRead?: (data: { conversationId: string; messageIds: string[]; readBy: string; readAt: Date }) => void;
  onUserOnline?: (data: { userId: string }) => void;
  onUserOffline?: (data: { userId: string }) => void;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string | null;
  mediaUrl: string | null;
  readAt: Date | null;
  createdAt: Date | string;
  sender?: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    verified: boolean;
  };
}

export function useWebSocket({
  userId,
  username,
  onMessage,
  onMessageSent,
  onTyping,
  onRead,
  onUserOnline,
  onUserOffline,
}: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<Map<string, boolean>>(new Map());

  // Initialize socket connection
  useEffect(() => {
    if (!userId || !username) return;

    // Connect to websocket server
    // Use XTransformPort for port forwarding
    const socketInstance = io("/?XTransformPort=3002", {
      transports: ["websocket", "polling"],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socketInstance;

    socketInstance.on("connect", () => {
      console.log("[WebSocket] Connected");
      setIsConnected(true);

      // Join personal room
      socketInstance.emit("join", { userId, username });
    });

    socketInstance.on("disconnect", () => {
      console.log("[WebSocket] Disconnected");
      setIsConnected(false);
    });

    // Handle incoming messages
    socketInstance.on("message", (data: { message: DirectMessage; senderId: string }) => {
      console.log("[WebSocket] Message received:", data);
      onMessage?.(data);
    });

    // Handle message sent confirmation
    socketInstance.on("message-sent", (data: { message: DirectMessage }) => {
      console.log("[WebSocket] Message sent:", data);
      onMessageSent?.(data);
    });

    // Handle typing indicator
    socketInstance.on("typing", (data: { senderId: string; conversationId: string; isTyping: boolean }) => {
      onTyping?.(data);
    });

    // Handle read receipts
    socketInstance.on("read", (data: { conversationId: string; messageIds: string[]; readBy: string; readAt: Date }) => {
      onRead?.(data);
    });

    // Handle user online/offline
    socketInstance.on("user-online", (data: { userId: string }) => {
      setActiveUsers((prev) => new Map(prev).set(data.userId, true));
      onUserOnline?.(data);
    });

    socketInstance.on("user-offline", (data: { userId: string }) => {
      setActiveUsers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(data.userId);
        return newMap;
      });
      onUserOffline?.(data);
    });

    // Handle active users list
    socketInstance.on("active-users", (data: { users: { id: string; username: string }[] }) => {
      const newMap = new Map<string, boolean>();
      data.users.forEach((user) => newMap.set(user.id, true));
      setActiveUsers(newMap);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [userId, username, onMessage, onMessageSent, onTyping, onRead, onUserOnline, onUserOffline]);

  // Send message via WebSocket
  const sendMessage = useCallback((message: DirectMessage, recipientId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("message", { message, recipientId });
    }
  }, [isConnected]);

  // Send typing indicator
  const sendTyping = useCallback((senderId: string, recipientId: string, conversationId: string, isTyping: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing", { senderId, recipientId, conversationId, isTyping });
    }
  }, [isConnected]);

  // Send read receipt
  const sendRead = useCallback((conversationId: string, messageIds: string[], readerId: string, senderId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("read", { conversationId, messageIds, readerId, senderId });
    }
  }, [isConnected]);

  // Check online status
  const checkOnlineStatus = useCallback((userIds: string[]) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("check-online", { userIds });
    }
  }, [isConnected]);

  // Check if a user is online
  const isUserOnline = useCallback((userId: string) => {
    return activeUsers.has(userId);
  }, [activeUsers]);

  return {
    isConnected,
    sendMessage,
    sendTyping,
    sendRead,
    checkOnlineStatus,
    isUserOnline,
    activeUsers,
  };
}
