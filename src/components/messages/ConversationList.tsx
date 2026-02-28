"use client";

import * as React from "react";
import { Search, MessageSquarePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationItem } from "./ConversationItem";
import type { Conversation } from "@/hooks/useConversations";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading?: boolean;
  activeConversationId?: string;
  onlineUsers?: Map<string, boolean>;
  onSelectConversation?: (conversation: Conversation) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onNewConversation?: () => void;
  className?: string;
}

export function ConversationList({
  conversations,
  isLoading = false,
  activeConversationId,
  onlineUsers = new Map(),
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  className,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter conversations by search query
  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(
      (conv) =>
        conv.user.username.toLowerCase().includes(query) ||
        conv.user.displayName?.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-black", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-twitter-border dark:border-twitter-border-dark">
        <h2 className="text-xl font-bold">Messages</h2>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={onNewConversation}
        >
          <MessageSquarePlus className="size-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-twitter-secondary dark:text-twitter-secondary-dark" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Direct Messages"
            className="pl-10 pr-10 bg-twitter-hover dark:bg-twitter-hover-dark border-0 rounded-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-twitter-secondary dark:text-twitter-secondary-dark hover:text-twitter-text dark:hover:text-twitter-text-dark"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          // Loading skeletons
          <div className="space-y-1 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 animate-pulse"
              >
                <div className="size-12 rounded-full bg-twitter-hover dark:bg-twitter-hover-dark" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
                  <div className="h-3 w-48 bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="size-16 rounded-full bg-twitter-hover dark:bg-twitter-hover-dark flex items-center justify-center mb-4">
              <MessageSquarePlus className="size-8 text-twitter-secondary dark:text-twitter-secondary-dark" />
            </div>
            <h3 className="text-xl font-bold mb-2">
              {searchQuery ? "No results found" : "Welcome to your inbox!"}
            </h3>
            <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px] max-w-[280px]">
              {searchQuery
                ? "Try searching for a different username."
                : "Drop a line, share posts and more with private conversations between you and others on X."}
            </p>
            {!searchQuery && (
              <Button
                className="mt-4 bg-twitter-blue hover:bg-twitter-blue/90 text-white rounded-full font-bold"
                onClick={onNewConversation}
              >
                Write a message
              </Button>
            )}
          </div>
        ) : (
          // Conversation items
          <div className="space-y-1">
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={activeConversationId === conversation.id}
                isOnline={onlineUsers.get(conversation.user.id)}
                onDelete={onDeleteConversation}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
