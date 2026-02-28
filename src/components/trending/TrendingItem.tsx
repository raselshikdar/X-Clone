"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TrendingItemData {
  id: string;
  hashtag: string;
  category: string;
  tweetCount: number;
  formattedCount: string;
}

interface TrendingItemProps {
  item: TrendingItemData;
  showOptions?: boolean;
}

export function TrendingItem({ item, showOptions = true }: TrendingItemProps) {
  return (
    <Link
      href={`/hashtag/${encodeURIComponent(item.hashtag.replace("#", ""))}`}
      className={cn(
        "flex items-start justify-between",
        "px-4 py-3",
        "hover:bg-twitter-hover-dark",
        "transition-colors duration-200",
        "group"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-gray-500">
          {item.category}
        </p>
        <p className="font-bold text-[15px] mt-0.5 truncate text-white">{item.hashtag}</p>
        <p className="text-[13px] text-gray-500 mt-0.5">
          {item.formattedCount}
        </p>
      </div>
      {showOptions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-8 rounded-full -mr-2 mt-1",
                "opacity-0 group-hover:opacity-100",
                "hover:bg-twitter-blue/10 hover:text-twitter-blue text-gray-500",
                "transition-opacity"
              )}
              onClick={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="size-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[250px] bg-black border-twitter-border-dark text-white">
            <DropdownMenuItem className="focus:bg-twitter-hover-dark">
              This trend is harmful or spammy
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-twitter-hover-dark">
              Not interested in this
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </Link>
  );
}
