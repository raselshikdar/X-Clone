"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/common/Avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Conversation } from "@/hooks/useConversations";

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  isOnline?: boolean;
  onDelete?: (conversationId: string) => void;
}

export function ConversationItem({
  conversation,
  isActive = false,
  isOnline,
  onDelete,
}: ConversationItemProps) {
  const { user, lastMessage, unreadCount, lastMessageAt } = conversation;

  // Format the last message time
  const timeAgo = lastMessage?.createdAt
    ? formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })
    : "";

  // Truncate message content
  const messagePreview = lastMessage?.content
    ? lastMessage.content.length > 50
      ? lastMessage.content.slice(0, 50) + "..."
      : lastMessage.content
    : lastMessage?.mediaUrl
    ? "Sent an image"
    : "No messages yet";

  return (
    <Link
      href={`/messages/${user.id}`}
      className={cn(
        "flex items-start gap-3 p-3",
        "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
        "transition-colors duration-200",
        "cursor-pointer",
        isActive && "bg-twitter-blue/5"
      )}
    >
      <div className="relative flex-shrink-0">
        <UserAvatar
          src={user.avatar}
          alt={user.displayName || user.username}
          fallback={user.displayName || user.username}
          size="lg"
          online={isOnline}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <span className="font-bold text-[15px] truncate">
              {user.displayName || user.username}
            </span>
            {user.verified && (
              <svg
                className="size-[18px] text-twitter-blue flex-shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
              </svg>
            )}
            <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px] truncate">
              @{user.username}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {timeAgo && (
              <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[13px]">
                {timeAgo}
              </span>
            )}
            {unreadCount > 0 && (
              <Badge className="bg-twitter-blue text-white text-[11px] min-w-[20px] h-5 px-1.5 rounded-full">
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p
            className={cn(
              "text-[15px] truncate",
              unreadCount > 0
                ? "text-twitter-text dark:text-twitter-text-dark font-medium"
                : "text-twitter-secondary dark:text-twitter-secondary-dark"
            )}
          >
            {messagePreview}
          </p>

          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 rounded-full hover:bg-twitter-blue/10 text-twitter-secondary dark:text-twitter-secondary-dark hover:text-twitter-blue"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-500 focus:text-red-500"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(conversation.id);
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </Link>
  );
}
