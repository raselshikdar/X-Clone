"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Image, Smile, MapPin, Calendar, X, Film, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CommunityTweetComposerProps {
  communityId: string;
  communityName: string;
  communityIcon?: string | null;
  onTweetPosted?: () => void;
}

const MAX_CHARS = 280;

export function CommunityTweetComposer({
  communityId,
  communityName,
  communityIcon,
  onTweetPosted,
}: CommunityTweetComposerProps) {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focus, setFocus] = useState(false);
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
      const response = await fetch(`/api/communities/${communityId}/tweets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to post");
      }

      setContent("");
      onTweetPosted?.();
    } catch (error) {
      console.error("Failed to post to community:", error);
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, content, isAuthenticated, communityId, onTweetPosted]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        "border-b border-twitter-border dark:border-twitter-border-dark",
        focus && "bg-twitter-hover/30 dark:bg-twitter-hover-dark/30"
      )}
    >
      <UserAvatar
        src={user?.image || null}
        alt={user?.name || "User"}
        fallback={user?.name || user?.username || "U"}
        size="md"
        className="shrink-0"
      />

      <div className="flex-1">
        {/* Community indicator */}
        <div className="flex items-center gap-2 mb-2 text-twitter-secondary dark:text-twitter-secondary-dark">
          <Users className="size-4" />
          <span className="text-[13px]">Posting to</span>
          <span className="font-medium text-[13px] text-black dark:text-white">
            {communityName}
          </span>
        </div>

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          placeholder="What's happening?"
          className={cn(
            "w-full resize-none border-0 bg-transparent p-0",
            "text-[17px] leading-normal",
            "placeholder:text-twitter-secondary dark:placeholder:text-twitter-secondary-dark",
            "focus:outline-none focus:ring-0 focus-visible:ring-0",
            "min-h-[56px]"
          )}
          rows={2}
        />

        {(focus || content.length > 0) && (
          <div className="flex items-center justify-between pt-3 border-t border-twitter-border dark:border-twitter-border-dark">
            {/* Action buttons */}
            <div className="flex items-center gap-1 -ml-2">
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
                        : "text-twitter-secondary dark:text-twitter-secondary-dark"
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
