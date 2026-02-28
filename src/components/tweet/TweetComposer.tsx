"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Image, Smile, MapPin, Calendar, X, Film, MoreHorizontal, Globe } from "lucide-react";

interface TweetComposerProps {
  onTweetPosted?: () => void;
  placeholder?: string;
  compact?: boolean;
}

const MAX_CHARS = 280;

export function TweetComposer({
  onTweetPosted,
  placeholder = "What's happening?",
  compact = false,
}: TweetComposerProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focus, setFocus] = useState(false);
  const [replySetting, setReplySetting] = useState<"everyone" | "following" | "mentioned">("everyone");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const canSubmit = content.trim().length > 0 && !isOverLimit && !isSubmitting;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [content]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to post tweet");
      }

      setContent("");
      onTweetPosted?.();
    } catch (error) {
      console.error("Failed to post tweet:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, content, isAuthenticated, onTweetPosted]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        "border-b border-twitter-border-dark",
        focus && "bg-twitter-hover-dark/30"
      )}
    >
      <UserAvatar
        src={user?.image || null}
        alt={user?.name || "User"}
        fallback={user?.name || user?.username || "U"}
        size={compact ? "sm" : "md"}
        className="shrink-0"
      />

      <div className="flex-1">
        {/* Reply setting - only visible when focused */}
        {(focus || content.length > 0) && (
          <button className="flex items-center gap-1 text-twitter-blue text-sm font-medium mb-2 py-1 px-2 -ml-2 rounded-full hover:bg-twitter-blue/10 transition-colors">
            <Globe className="h-4 w-4" />
            <span>Everyone can reply</span>
          </button>
        )}

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder={placeholder}
          className={cn(
            "w-full resize-none border-0 bg-transparent p-0",
            "text-[17px] leading-normal",
            "text-white placeholder:text-gray-500",
            "focus:outline-none focus:ring-0 focus-visible:ring-0",
            "min-h-[56px]"
          )}
          rows={compact ? 1 : 2}
        />

        {(focus || content.length > 0) && (
          <div className="flex items-center justify-between pt-3 border-t border-twitter-border-dark">
            {/* Action buttons */}
            <div className="flex items-center gap-0 -ml-2">
              <button
                type="button"
                className={cn(
                  "p-2 rounded-full",
                  "text-twitter-blue",
                  "hover:bg-twitter-blue/10",
                  "transition-colors duration-200"
                )}
              >
                <Image className="size-5" aria-label="Upload image" />
              </button>
              <button
                type="button"
                className={cn(
                  "p-2 rounded-full",
                  "text-twitter-blue",
                  "hover:bg-twitter-blue/10",
                  "transition-colors duration-200"
                )}
              >
                <Film className="size-5" />
              </button>
              <button
                type="button"
                className={cn(
                  "p-2 rounded-full",
                  "text-twitter-blue",
                  "hover:bg-twitter-blue/10",
                  "transition-colors duration-200"
                )}
              >
                <Smile className="size-5" />
              </button>
              <button
                type="button"
                className={cn(
                  "p-2 rounded-full",
                  "text-twitter-blue",
                  "hover:bg-twitter-blue/10",
                  "transition-colors duration-200"
                )}
              >
                <Calendar className="size-5" />
              </button>
              <button
                type="button"
                className={cn(
                  "p-2 rounded-full",
                  "text-twitter-blue",
                  "hover:bg-twitter-blue/10",
                  "transition-colors duration-200"
                )}
              >
                <MapPin className="size-5" />
              </button>
            </div>

            {/* Submit area */}
            <div className="flex items-center gap-3">
              {/* Character count */}
              {content.length > 0 && (
                <div
                  className={cn(
                    "text-sm",
                    isOverLimit
                      ? "text-red-500"
                      : MAX_CHARS - charCount <= 20
                        ? "text-yellow-500"
                        : "text-gray-500"
                  )}
                >
                  {MAX_CHARS - charCount}
                </div>
              )}

              {/* Post button */}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "rounded-full font-bold px-4 py-1.5",
                  "bg-twitter-blue hover:bg-twitter-blue/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
