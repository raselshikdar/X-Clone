"use client";

import * as React from "react";
import { ImageIcon, Smile, Send, X, Reply, Gif } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageInputProps {
  onSend: (content: string, mediaUrl?: string) => void;
  onTyping?: () => void;
  disabled?: boolean;
  maxLength?: number;
  placeholder?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  onCancelReply?: () => void;
  className?: string;
}

// Common emojis for quick selection
const QUICK_EMOJIS = [
  "😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎",
  "❤️", "🔥", "🎉", "👏", "🙏", "💯", "✨", "🤣", "😍", "🥺",
];

export function MessageInput({
  onSend,
  onTyping,
  disabled = false,
  maxLength = 1000,
  placeholder = "Start a new message",
  replyTo,
  onCancelReply,
  className,
}: MessageInputProps) {
  const [content, setContent] = React.useState("");
  const [mediaUrl, setMediaUrl] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  }, [content]);

  // Focus textarea on mount
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = () => {
    if (disabled) return;
    if (!content.trim() && !mediaUrl) return;

    onSend(content.trim(), mediaUrl || undefined);
    setContent("");
    setMediaUrl(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onTyping?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For now, use a placeholder - in real app would upload to storage
    // Here we'll create a local URL for preview
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
  };

  const characterCount = content.length;
  const isOverLimit = characterCount > maxLength;
  const canSend = (content.trim() || mediaUrl) && !isOverLimit && !disabled;

  return (
    <div className={cn("border-t border-twitter-border dark:border-twitter-border-dark", className)}>
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-twitter-hover dark:bg-twitter-hover-dark border-b border-twitter-border dark:border-twitter-border-dark">
          <Reply className="size-4 text-twitter-secondary dark:text-twitter-secondary-dark" />
          <div className="flex-1 min-w-0">
            <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[13px]">
              Replying to{" "}
              <span className="text-twitter-blue font-medium">
                @{replyTo.senderName}
              </span>
            </span>
            <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-sm truncate">
              {replyTo.content}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-6 rounded-full"
            onClick={onCancelReply}
          >
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Media preview */}
      {mediaUrl && (
        <div className="relative inline-block px-4 pt-3">
          <img
            src={mediaUrl}
            alt="Upload preview"
            className="max-h-32 rounded-lg"
          />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 size-6 rounded-full bg-black/60 hover:bg-black/80"
            onClick={() => setMediaUrl(null)}
          >
            <X className="size-3 text-white" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-4">
        {/* Image upload */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
          <div className="p-2 rounded-full hover:bg-twitter-blue/10 transition-colors">
            <ImageIcon className="size-5 text-twitter-blue" />
          </div>
        </label>

        {/* GIF button */}
        <button className="p-2 rounded-full hover:bg-twitter-blue/10 transition-colors">
          <Gif className="size-5 text-twitter-blue" />
        </button>

        {/* Emoji picker */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-2 rounded-full hover:bg-twitter-blue/10 transition-colors">
              <Smile className="size-5 text-twitter-blue" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-64 p-2 bg-white dark:bg-black border border-twitter-border dark:border-twitter-border-dark"
            align="start"
            side="top"
          >
            <div className="grid grid-cols-10 gap-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className="size-7 flex items-center justify-center hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark rounded text-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            rows={1}
            className={cn(
              "resize-none border-0 bg-transparent focus-visible:ring-0 p-0 text-[15px] placeholder:text-twitter-secondary dark:placeholder:text-twitter-secondary-dark",
              "max-h-[120px] overflow-y-auto"
            )}
          />

          {/* Character counter */}
          {characterCount > maxLength * 0.8 && (
            <span
              className={cn(
                "absolute right-0 bottom-0 text-xs",
                isOverLimit
                  ? "text-red-500"
                  : "text-twitter-secondary dark:text-twitter-secondary-dark"
              )}
            >
              {maxLength - characterCount}
            </span>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          className={cn(
            "rounded-full size-9",
            canSend
              ? "bg-twitter-blue hover:bg-twitter-blue/90"
              : "bg-twitter-hover dark:bg-twitter-hover-dark"
          )}
        >
          <Send
            className={cn(
              "size-4",
              canSend ? "text-white" : "text-twitter-secondary dark:text-twitter-secondary-dark"
            )}
          />
        </Button>
      </div>
    </div>
  );
}
