"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

export interface ConversationUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  verified: boolean;
}

export interface LastMessage {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  senderId: string;
  createdAt: Date | string;
}

export interface Conversation {
  id: string;
  user: ConversationUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
  lastMessageAt: Date | string;
}

interface ConversationsResponse {
  conversations: Conversation[];
}

interface SendMessageData {
  recipientId: string;
  content?: string;
  mediaUrl?: string;
}

interface SendMessageResponse {
  message: {
    id: string;
    conversationId: string;
    senderId: string;
    recipientId: string;
    content: string | null;
    mediaUrl: string | null;
    createdAt: Date | string;
    sender: ConversationUser;
    recipient: ConversationUser;
  };
  conversationId: string;
}

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch conversations
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<ConversationsResponse>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await fetch("/api/messages");
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      return response.json();
    },
    enabled: !!user,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  // Start new conversation / send message
  const sendMessageMutation = useMutation({
    mutationFn: async (data: SendMessageData): Promise<SendMessageResponse> => {
      const response = await fetch("/api/messages", {
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
      // Invalidate conversations to refresh the list
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const conversations = data?.conversations ?? [];

  // Get conversation with a specific user
  const getConversationWithUser = (userId: string): Conversation | undefined => {
    return conversations.find((c) => c.user.id === userId);
  };

  // Calculate total unread count
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return {
    conversations,
    isLoading,
    error,
    refetch,
    sendMessage: sendMessageMutation.mutate,
    sendMessageAsync: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendError: sendMessageMutation.error,
    getConversationWithUser,
    totalUnread,
  };
}
