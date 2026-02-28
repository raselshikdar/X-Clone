"use client";

import * as React from "react";
import Image from "next/image";
import { format, isToday, isYesterday, isSameYear } from "date-fns";
import {
  MoreHorizontal,
  Trash2,
  Copy,
  CheckCheck,
  Check,
  Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Message } from "@/hooks/useMessages";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onDelete?: (messageId: string, forEveryone: boolean) => void;
  onReact?: (messageId: string, emoji: string) => void;
}

const EMOJI_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

export function MessageBubble({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  onDelete,
  onReact,
}: MessageBubbleProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showReactionPicker, setShowReactionPicker] = React.useState(false);

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    if (isToday(d)) {
      return format(d, "h:mm a");
    }
    if (isYesterday(d)) {
      return `Yesterday ${format(d, "h:mm a")}`;
    }
    if (isSameYear(d, new Date())) {
      return format(d, "MMM d, h:mm a");
    }
    return format(d, "MMM d, yyyy, h:mm a");
  };

  const copyToClipboard = async () => {
    if (message.content) {
      await navigator.clipboard.writeText(message.content);
    }
  };

  const handleDelete = (forEveryone: boolean) => {
    onDelete?.(message.id, forEveryone);
    setShowMenu(false);
  };

  const handleReact = (emoji: string) => {
    onReact?.(message.id, emoji);
    setShowReactionPicker(false);
  };

  // Read receipt status
  const readReceipt = message.readAt ? (
    <CheckCheck className="size-4 text-twitter-blue" />
  ) : (
    <Check className="size-4 text-twitter-secondary dark:text-twitter-secondary-dark" />
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            "flex gap-2 px-4 py-1 group",
            isOwn ? "flex-row-reverse" : "flex-row"
          )}
        >
          {/* Avatar */}
          {showAvatar && !isOwn && (
            <div className="flex-shrink-0">
              <div className="size-8 rounded-full overflow-hidden bg-twitter-hover dark:bg-twitter-hover-dark">
                {message.sender?.avatar ? (
                  <Image
                    src={message.sender.avatar}
                    alt={message.sender.displayName || message.sender.username}
                    width={32}
                    height={32}
                    className="object-cover"
                  />
                ) : (
                  <div className="size-8 flex items-center justify-center text-twitter-blue font-bold text-sm">
                    {(message.sender?.displayName || message.sender?.username || "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Content */}
          <div
            className={cn(
              "flex flex-col max-w-[70%]",
              isOwn ? "items-end" : "items-start"
            )}
          >
            {/* Text Content */}
            {message.content && (
              <div
                className={cn(
                  "px-3 py-2 rounded-2xl text-[15px] break-words",
                  isOwn
                    ? "bg-twitter-blue text-white rounded-br-md"
                    : "bg-twitter-hover dark:bg-twitter-hover-dark rounded-bl-md"
                )}
              >
                {message.content}
              </div>
            )}

            {/* Media Content */}
            {message.mediaUrl && (
              <div
                className={cn(
                  "rounded-2xl overflow-hidden mt-1 max-w-[280px]",
                  !message.content && (isOwn ? "rounded-br-md" : "rounded-bl-md")
                )}
              >
                <Image
                  src={message.mediaUrl}
                  alt="Sent image"
                  width={280}
                  height={200}
                  className="object-cover"
                />
              </div>
            )}

            {/* Timestamp and Read Receipt */}
            {showTimestamp && (
              <div
                className={cn(
                  "flex items-center gap-1 mt-1 text-twitter-secondary dark:text-twitter-secondary-dark text-xs",
                  isOwn ? "flex-row-reverse" : "flex-row"
                )}
              >
                <span>{formatTime(message.createdAt)}</span>
                {isOwn && readReceipt}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          <div
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity self-start mt-1",
              isOwn ? "order-first" : "order-last"
            )}
          >
            <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark">
                  <MoreHorizontal className="size-4 text-twitter-secondary dark:text-twitter-secondary-dark" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                {message.content && (
                  <DropdownMenuItem onClick={copyToClipboard}>
                    <Copy className="size-4 mr-2" />
                    Copy text
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowReactionPicker(true)}>
                  <Smile className="size-4 mr-2" />
                  React
                </DropdownMenuItem>
                {isOwn && (
                  <>
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={() => handleDelete(false)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete for you
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={() => handleDelete(true)}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete for everyone
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        {message.content && (
          <ContextMenuItem onClick={copyToClipboard}>
            <Copy className="size-4 mr-2" />
            Copy text
          </ContextMenuItem>
        )}
        {isOwn && (
          <ContextMenuItem
            className="text-red-500 focus:text-red-500"
            onClick={() => handleDelete(true)}
          >
            <Trash2 className="size-4 mr-2" />
            Delete message
          </ContextMenuItem>
        )}
      </ContextMenuContent>

      {/* Reaction Picker - would be shown as a popover */}
      {showReactionPicker && (
        <div className="fixed inset-0 z-50" onClick={() => setShowReactionPicker(false)}>
          <div
            className={cn(
              "absolute bg-white dark:bg-black border border-twitter-border dark:border-twitter-border-dark rounded-full shadow-lg flex items-center gap-1 p-1",
              "animate-in fade-in-0 zoom-in-95"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {EMOJI_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReact(emoji)}
                className="size-8 flex items-center justify-center hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark rounded-full transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </ContextMenu>
  );
}
