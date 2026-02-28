"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { X, Globe, Users, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTweetStore, type Tweet } from "@/stores/tweetStore";

const MAX_CHARS = 280;

interface ReplyComposerProps {
  tweet: Tweet;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
  inline?: boolean;
}

export function ReplyComposer({
  tweet,
  onSuccess,
  onCancel,
  className,
  inline = false,
}: ReplyComposerProps) {
  const { data: session } = useSession();
  const { createTweet } = useTweetStore();

  const [content, setContent] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [replyVisibility, setReplyVisibility] = React.useState<
    "everyone" | "following" | "mentioned"
  >("everyone");

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;
  const isEmpty = !content.trim();
  const canPost = !isEmpty && !isOverLimit && !isSubmitting;

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
        replyToId: tweet.id,
      });

      setContent("");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityConfig = {
    everyone: { icon: Globe, label: "Everyone" },
    following: { icon: Users, label: "Following" },
    mentioned: { icon: AtSign, label: "Mentioned" },
  };

  const currentVisibility = visibilityConfig[replyVisibility];
  const VisibilityIcon = currentVisibility.icon;

  if (!session?.user) return null;

  return (
    <div className={cn("flex gap-3", inline ? "py-3" : "p-4", className)}>
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
        {/* Reply visibility dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-twitter-blue border-twitter-blue rounded-full px-3 text-[13px] font-medium mb-2"
            >
              <VisibilityIcon className="size-3.5" />
              {currentVisibility.label} can reply
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => setReplyVisibility("everyone")}
              className="gap-3"
            >
              <Globe className="size-4" />
              <div>
                <div className="font-medium">Everyone</div>
                <div className="text-xs text-twitter-secondary">Anyone can reply</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setReplyVisibility("following")}
              className="gap-3"
            >
              <Users className="size-4" />
              <div>
                <div className="font-medium">Following</div>
                <div className="text-xs text-twitter-secondary">People you follow can reply</div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setReplyVisibility("mentioned")}
              className="gap-3"
            >
              <AtSign className="size-4" />
              <div>
                <div className="font-medium">Mentioned</div>
                <div className="text-xs text-twitter-secondary">Only people you mention can reply</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Replying to */}
        <div className="text-[13px] text-twitter-secondary mb-1">
          Replying to{" "}
          <span className="text-twitter-blue">@{tweet.author.username}</span>
        </div>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Post your reply"
          className={cn(
            "w-full resize-none border-0 p-0 text-lg placeholder:text-twitter-secondary dark:placeholder:text-twitter-secondary-dark",
            "focus-visible:ring-0 focus-visible:ring-offset-0",
            "bg-transparent",
            "min-h-[40px]"
          )}
          rows={1}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-3">
          {/* Cancel button (for inline) */}
          {inline && onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-twitter-secondary hover:text-twitter-blue"
            >
              Cancel
            </Button>
          )}

          {/* Character count */}
          {charCount > 0 && (
            <div
              className={cn(
                "text-sm",
                isOverLimit ? "text-red-500" : "text-twitter-secondary"
              )}
            >
              {charCount}/{MAX_CHARS}
            </div>
          )}

          {/* Reply button */}
          <Button
            onClick={handleSubmit}
            disabled={!canPost}
            className={cn(
              "rounded-full font-bold px-4 h-9",
              "bg-twitter-blue hover:bg-twitter-blue/90",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isSubmitting ? "Replying..." : "Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
