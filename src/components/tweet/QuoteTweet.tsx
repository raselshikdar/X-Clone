"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTweetStore, type Tweet } from "@/stores/tweetStore";

const MAX_CHARS = 280;
const QUOTE_LINK_LENGTH = 23; // Twitter counts links as 23 chars

interface QuoteTweetProps {
  quotedTweet: Tweet;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function QuoteTweet({
  quotedTweet,
  onSuccess,
  onCancel,
  className,
}: QuoteTweetProps) {
  const { data: session } = useSession();
  const { createTweet } = useTweetStore();

  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Effective character count includes the quoted tweet link
  const effectiveCharCount = content.length + (content.length > 0 ? QUOTE_LINK_LENGTH : 0);
  const isOverLimit = effectiveCharCount > MAX_CHARS;
  const canPost = !isOverLimit && !isSubmitting;

  // Auto-focus on mount
  React.useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!canPost || !session?.user) return;

    setIsSubmitting(true);

    try {
      await createTweet({
        content,
        quoteToId: quotedTweet.id,
      });

      setContent("");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating quote tweet:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;

    const d = new Date(date);
    return `${d.getMonth() + 1} ${d.getDate()}`;
  };

  if (!session?.user) return null;

  return (
    <div className={cn("p-4", className)}>
      <div className="flex gap-3">
        {/* Avatar */}
        <UserAvatar
          src={session.user.image || null}
          alt={session.user.name || "User"}
          fallback={session.user.name || "U"}
          size="md"
          className="shrink-0"
        />

        {/* Composer area */}
        <div className="flex-1 min-w-0">
          {/* Textarea */}
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment"
            className={cn(
              "w-full resize-none border-0 p-0 text-xl placeholder:text-twitter-secondary dark:placeholder:text-twitter-secondary-dark",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "bg-transparent",
              "min-h-[56px]"
            )}
            rows={1}
          />

          {/* Quoted tweet preview */}
          <div className="mt-3 rounded-2xl border border-twitter-border dark:border-twitter-border-dark overflow-hidden">
            {/* Quoted tweet header */}
            <div className="p-3">
              <div className="flex items-center gap-2">
                <UserAvatar
                  src={quotedTweet.author.avatar}
                  alt={quotedTweet.author.name}
                  fallback={quotedTweet.author.name}
                  size="sm"
                />
                <span className="font-bold text-[15px]">
                  {quotedTweet.author.name}
                </span>
                <span className="text-twitter-secondary text-[15px]">
                  @{quotedTweet.author.username}
                </span>
                <span className="text-twitter-secondary text-[15px]">·</span>
                <span className="text-twitter-secondary text-[15px]">
                  {formatRelativeTime(quotedTweet.createdAt)}
                </span>
              </div>

              {/* Quoted tweet content */}
              {quotedTweet.content && (
                <p className="mt-1 text-[15px] whitespace-pre-wrap break-words">
                  {quotedTweet.content}
                </p>
              )}
            </div>

            {/* Quoted tweet media */}
            {quotedTweet.media && quotedTweet.media.length > 0 && (
              <div className="aspect-video relative">
                <img
                  src={quotedTweet.media[0].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-twitter-border dark:border-twitter-border-dark">
            {/* Cancel button */}
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-twitter-secondary hover:text-twitter-blue"
              >
                Cancel
              </Button>
            )}

            {/* Character count */}
            <div className="flex items-center gap-3 ml-auto">
              {content.length > 0 && (
                <div
                  className={cn(
                    "text-sm",
                    isOverLimit ? "text-red-500" : "text-twitter-secondary"
                  )}
                >
                  {effectiveCharCount}/{MAX_CHARS}
                </div>
              )}

              {/* Quote button */}
              <Button
                onClick={handleSubmit}
                disabled={!canPost}
                className={cn(
                  "rounded-full font-bold px-4 h-9",
                  "bg-twitter-blue hover:bg-twitter-blue/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSubmitting ? "Posting..." : "Quote"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
