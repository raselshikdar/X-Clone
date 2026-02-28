"use client";

import * as React from "react";
import { Avatar as AvatarPrimitive, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  xs: "size-6",
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-16",
};

const onlineIndicatorSizes = {
  xs: "size-2 border",
  sm: "size-2.5 border-2",
  md: "size-3 border-2",
  lg: "size-3.5 border-2",
  xl: "size-4 border-2",
};

export function UserAvatar({
  src,
  alt = "Avatar",
  fallback = "U",
  size = "md",
  online,
  className,
}: AvatarProps) {
  return (
    <div className="relative inline-flex shrink-0">
      <AvatarPrimitive
        className={cn(
          sizeClasses[size],
          "ring-0",
          className
        )}
      >
        <AvatarImage src={src || undefined} alt={alt} />
        <AvatarFallback className="bg-gray-800 text-white font-semibold text-sm">
          {fallback.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </AvatarPrimitive>
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full",
            onlineIndicatorSizes[size],
            online ? "bg-green-500" : "bg-gray-400",
            "border-black"
          )}
        />
      )}
    </div>
  );
}
