"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useTypingReceiver } from "@/hooks/useTypingIndicator";
import { ConversationList } from "@/components/messages/ConversationList";
import { NewMessageModal } from "@/components/messages/NewMessageModal";

export default function MessagesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    conversations,
    isLoading: isConversationsLoading,
    refetch,
  } = useConversations();
  const [isNewMessageOpen, setIsNewMessageOpen] = React.useState(false);

  // Typing receiver for showing who is typing
  const { updateTypingStatus } = useTypingReceiver();

  // WebSocket connection
  const { isConnected, isUserOnline, activeUsers } = useWebSocket({
    userId: user?.id,
    username: user?.username,
    onTyping: (data) => {
      updateTypingStatus(data.conversationId, data.isTyping);
    },
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Get recent contacts for new message modal
  const recentContacts = React.useMemo(() => {
    return conversations.slice(0, 5).map((c) => c.user);
  }, [conversations]);

  // Convert activeUsers Map to a format for checking online status
  const onlineUsersMap = React.useMemo(() => {
    return activeUsers;
  }, [activeUsers]);

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
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Conversation List - Takes full width on desktop when no chat selected */}
        <div className="w-full md:w-[350px] lg:w-[400px] border-r border-twitter-border dark:border-twitter-border-dark flex-shrink-0">
          <ConversationList
            conversations={conversations}
            isLoading={isConversationsLoading}
            onlineUsers={onlineUsersMap}
            onNewConversation={() => setIsNewMessageOpen(true)}
          />
        </div>

        {/* Empty chat placeholder - visible on larger screens */}
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center max-w-sm">
            <h2 className="text-3xl font-bold mb-4">Select a conversation</h2>
            <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px] mb-6">
              Choose from your existing conversations or start a new one.
            </p>
            <button
              onClick={() => setIsNewMessageOpen(true)}
              className="px-6 py-3 bg-twitter-blue hover:bg-twitter-blue/90 text-white font-bold rounded-full transition-colors"
            >
              New message
            </button>
          </div>
        </div>
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
