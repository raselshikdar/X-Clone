"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format, isToday, isYesterday, isSameYear, isSameDay } from "date-fns";
import { ArrowLeft, Info, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/Avatar";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import type { Message, MessageUser } from "@/hooks/useMessages";

interface ChatWindowProps {
  messages: Message[];
  otherUser: MessageUser | null | undefined;
  isLoading?: boolean;
  isTyping?: boolean;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onLoadMore?: () => void;
  onDeleteMessage?: (messageId: string, forEveryone: boolean) => void;
  onReact?: (messageId: string, emoji: string) => void;
  children?: React.ReactNode; // For MessageInput
  className?: string;
}

export function ChatWindow({
  messages,
  otherUser,
  isLoading = false,
  isTyping = false,
  hasMore = false,
  isFetchingMore = false,
  onLoadMore,
  onDeleteMessage,
  onReact,
  children,
  className,
}: ChatWindowProps) {
  const router = useRouter();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = React.useState(true);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    if (shouldAutoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, shouldAutoScroll]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShouldAutoScroll(isAtBottom);
  }, []);

  // Handle loading more messages
  const handleScrollToTop = React.useCallback(() => {
    if (containerRef.current) {
      const { scrollTop } = containerRef.current;
      if (scrollTop < 50 && hasMore && !isFetchingMore && onLoadMore) {
        onLoadMore();
      }
    }
  }, [hasMore, isFetchingMore, onLoadMore]);

  // Group messages by date
  const groupedMessages = React.useMemo(() => {
    const groups: { date: Date; messages: Message[] }[] = [];

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && isSameDay(lastGroup.date, msgDate)) {
        lastGroup.messages.push(msg);
      } else {
        groups.push({ date: msgDate, messages: [msg] });
      }
    });

    return groups;
  }, [messages]);

  // Format date separator
  const formatDateSeparator = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    if (isSameYear(date, new Date())) {
      return format(date, "MMMM d");
    }
    return format(date, "MMMM d, yyyy");
  };

  return (
    <div className={cn("flex flex-col h-full bg-white dark:bg-black", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-twitter-border dark:border-twitter-border-dark">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full md:hidden"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-5" />
        </Button>

        {otherUser && (
          <div className="flex items-center gap-3 flex-1">
            <UserAvatar
              src={otherUser.avatar}
              alt={otherUser.displayName || otherUser.username}
              fallback={otherUser.displayName || otherUser.username}
              size="md"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[15px]">
                  {otherUser.displayName || otherUser.username}
                </span>
                {otherUser.verified && (
                  <svg
                    className="size-[18px] text-twitter-blue"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                  </svg>
                )}
              </div>
              <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[13px]">
                @{otherUser.username}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Info className="size-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea
        className="flex-1"
        onScroll={handleScroll}
        ref={containerRef}
      >
        <div onScroll={handleScrollToTop} className="min-h-full flex flex-col">
          {/* Load more button */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onLoadMore}
                disabled={isFetchingMore}
                className="text-twitter-blue"
              >
                {isFetchingMore ? "Loading..." : "Load earlier messages"}
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading && messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin size-8 border-2 border-twitter-blue border-t-transparent rounded-full" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && messages.length === 0 && otherUser && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="size-16 rounded-full bg-twitter-hover dark:bg-twitter-hover-dark flex items-center justify-center mb-4">
                <UserAvatar
                  src={otherUser.avatar}
                  alt={otherUser.displayName || otherUser.username}
                  fallback={otherUser.displayName || otherUser.username}
                  size="xl"
                />
              </div>
              <h3 className="text-xl font-bold mb-2">
                This is the beginning of your conversation with @{otherUser.username}
              </h3>
              <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px]">
                Say something to start the conversation!
              </p>
            </div>
          )}

          {/* Messages grouped by date */}
          {groupedMessages.map((group) => (
            <div key={group.date.toISOString()}>
              {/* Date Separator */}
              <div className="flex items-center justify-center py-4">
                <div className="bg-twitter-hover dark:bg-twitter-hover-dark px-3 py-1 rounded-full text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
                  {formatDateSeparator(group.date)}
                </div>
              </div>

              {/* Messages for this date */}
              {group.messages.map((message, index) => {
                const prevMessage = group.messages[index - 1];
                const showAvatar =
                  !prevMessage ||
                  prevMessage.senderId !== message.senderId ||
                  Math.abs(
                    new Date(message.createdAt).getTime() -
                      new Date(prevMessage.createdAt).getTime()
                  ) > 5 * 60 * 1000; // 5 minutes gap

                return (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId !== otherUser?.id}
                    showAvatar={showAvatar}
                    onDelete={onDeleteMessage}
                    onReact={onReact}
                  />
                );
              })}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="px-4 py-2">
              <TypingIndicator />
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      {children}
    </div>
  );
}
