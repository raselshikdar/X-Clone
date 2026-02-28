"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useWebSocket, type DirectMessage } from "@/hooks/useWebSocket";
import {
  useTypingIndicator,
  useTypingReceiver,
} from "@/hooks/useTypingIndicator";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatWindow } from "@/components/messages/ChatWindow";
import { MessageInput } from "@/components/messages/MessageInput";
import { NewMessageModal } from "@/components/messages/NewMessageModal";
import type { Message } from "@/hooks/useMessages";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const otherUserId = params.userId as string;

  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    conversations,
    isLoading: isConversationsLoading,
    refetch: refetchConversations,
  } = useConversations();

  // Messages hook
  const {
    messages,
    otherUser,
    conversationId,
    isLoading: isMessagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    sendMessageAsync,
    isSending,
    deleteMessageAsync,
    addMessageOptimistically,
  } = useMessages({ userId: otherUserId });

  // Typing receiver
  const { typingUsers, updateTypingStatus, isUserTyping } = useTypingReceiver();

  // Find current conversation
  const currentConversation = conversations.find((c) => c.user.id === otherUserId);

  // Check if other user is typing
  const isOtherTyping = conversationId ? isUserTyping(conversationId) : false;

  // State for new message modal
  const [isNewMessageOpen, setIsNewMessageOpen] = React.useState(false);

  // State for showing conversation list on mobile
  const [showMobileChat, setShowMobileChat] = React.useState(true);

  // WebSocket connection
  const { isConnected, sendMessage, sendTyping, isUserOnline, activeUsers } =
    useWebSocket({
      userId: user?.id,
      username: user?.username,
      onMessage: (data) => {
        // Add the message optimistically
        const newMessage: Message = {
          ...data.message,
          sender: data.message.sender || {
            id: data.senderId,
            username: "",
            displayName: "",
            avatar: null,
            verified: false,
          },
        };
        addMessageOptimistically(newMessage);
        // Refetch to get the correct data
        refetchConversations();
      },
      onTyping: (data) => {
        if (data.conversationId === conversationId) {
          updateTypingStatus(data.conversationId, data.isTyping);
        }
      },
      onRead: (data) => {
        // Update read status in UI
        // This would update the read receipts for messages
      },
    });

  // Typing indicator
  const { handleTypingStart, handleTypingStop } = useTypingIndicator({
    sendTypingStatus: (isTyping) => {
      if (conversationId && user?.id && otherUserId) {
        sendTyping(user.id, otherUserId, conversationId, isTyping);
      }
    },
    stopDelay: 3000,
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Handle sending message
  const handleSendMessage = async (content: string, mediaUrl?: string) => {
    try {
      const result = await sendMessageAsync({ content, mediaUrl });

      // Send via WebSocket for real-time
      if (result.message && isConnected) {
        sendMessage(result.message as DirectMessage, otherUserId);
      }

      // Refetch conversations to update last message
      refetchConversations();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  // Handle deleting message
  const handleDeleteMessage = async (messageId: string, forEveryone: boolean) => {
    try {
      await deleteMessageAsync({ messageId, forEveryone });
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  // Handle typing
  const handleTyping = () => {
    handleTypingStart();
  };

  // Get recent contacts for new message modal
  const recentContacts = React.useMemo(() => {
    return conversations.slice(0, 5).map((c) => c.user);
  }, [conversations]);

  // Online users map
  const onlineUsersMap = React.useMemo(() => {
    return activeUsers;
  }, [activeUsers]);

  // Handle selecting conversation (mobile)
  const handleSelectConversation = (conversation: typeof conversations[0]) => {
    router.push(`/messages/${conversation.user.id}`);
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin size-8 border-2 border-twitter-blue border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Conversation List - Hidden on mobile when chat is open */}
      <div
        className={cn(
          "w-full md:w-[350px] lg:w-[400px] border-r border-twitter-border dark:border-twitter-border-dark flex-shrink-0",
          "hidden md:block"
        )}
      >
        <ConversationList
          conversations={conversations}
          isLoading={isConversationsLoading}
          activeConversationId={conversationId}
          onlineUsers={onlineUsersMap}
          onNewConversation={() => setIsNewMessageOpen(true)}
        />
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        <ChatWindow
          messages={messages}
          otherUser={otherUser}
          isLoading={isMessagesLoading}
          isTyping={isOtherTyping}
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          onLoadMore={fetchNextPage}
          onDeleteMessage={handleDeleteMessage}
        >
          <MessageInput
            onSend={handleSendMessage}
            onTyping={handleTyping}
            disabled={isSending || !otherUser}
            maxLength={1000}
            placeholder={otherUser ? `Message @${otherUser.username}` : "Start a message"}
          />
        </ChatWindow>
      </div>

      {/* New Message Modal */}
      <NewMessageModal
        open={isNewMessageOpen}
        onOpenChange={setIsNewMessageOpen}
        recentContacts={recentContacts}
      />
    </div>
  );
}
