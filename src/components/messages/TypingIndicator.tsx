"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-sm">
        typing
      </span>
      <div className="flex items-center gap-0.5">
        <span
          className="size-1.5 bg-twitter-secondary dark:bg-twitter-secondary-dark rounded-full animate-bounce"
          style={{ animationDelay: "0ms", animationDuration: "0.6s" }}
        />
        <span
          className="size-1.5 bg-twitter-secondary dark:bg-twitter-secondary-dark rounded-full animate-bounce"
          style={{ animationDelay: "150ms", animationDuration: "0.6s" }}
        />
        <span
          className="size-1.5 bg-twitter-secondary dark:bg-twitter-secondary-dark rounded-full animate-bounce"
          style={{ animationDelay: "300ms", animationDuration: "0.6s" }}
        />
      </div>
    </div>
  );
}
