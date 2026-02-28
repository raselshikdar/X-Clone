"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import type { DirectMessage } from "./useWebSocket";

export interface MessageUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  verified: boolean;
}

export interface Message extends DirectMessage {
  sender: MessageUser;
}

interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
  user: MessageUser;
  conversationId?: string;
}

interface UseMessagesOptions {
  userId: string;
  enabled?: boolean;
}

export function useMessages({ userId, enabled = true }: UseMessagesOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages with specific user
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<MessagesResponse>({
    queryKey: ["messages", userId],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: "30",
      });
      if (pageParam) {
        params.append("cursor", pageParam as string);
      }
      const response = await fetch(`/api/messages/${userId}?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && !!user && !!userId,
    staleTime: 1000 * 10, // 10 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content?: string; mediaUrl?: string }) => {
      const response = await fetch(`/api/messages/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate messages to refresh
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
      // Also invalidate conversations
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Delete message
  const deleteMessageMutation = useMutation({
    mutationFn: async ({ messageId, forEveryone = false }: { messageId: string; forEveryone?: boolean }) => {
      const params = new URLSearchParams();
      if (forEveryone) {
        params.append("forEveryone", "true");
      }
      const response = await fetch(`/api/messages/${messageId}?${params.toString()}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete message");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate messages to refresh
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
      // Also invalidate conversations
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: async (data: { conversationId?: string; messageIds?: string[] }) => {
      const response = await fetch("/api/messages/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to mark as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Flatten messages from all pages
  const messages = data?.pages.flatMap((page) => page.messages) ?? [];

  // Get the other user info from first page
  const otherUser = data?.pages[0]?.user;

  // Get conversation ID from first page
  const conversationId = data?.pages[0]?.conversationId;

  // Optimistically add a message (for real-time updates)
  const addMessageOptimistically = (message: Message) => {
    queryClient.setQueryData<MessagesResponse[]>(["messages", userId], (old) => {
      if (!old) return old;
      return old.map((page, index) => {
        if (index === 0) {
          return {
            ...page,
            messages: [message, ...page.messages],
          };
        }
        return page;
      });
    });
  };

  return {
    messages,
    otherUser,
    conversationId,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    sendMessage: sendMessageMutation.mutate,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    deleteMessage: deleteMessageMutation.mutate,
    deleteMessageAsync: deleteMessageMutation.mutateAsync,
    isDeleting: deleteMessageMutation.isPending,
    markAsRead: markAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,
    addMessageOptimistically,
  };
}
