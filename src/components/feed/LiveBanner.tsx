"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { MoreHorizontal, ChevronRight, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LiveBroadcast {
  id: string;
  title: string;
  viewerCount: number;
  thumbnailUrl?: string;
  sourceIcon?: string;
  sourceName: string;
  isLive: boolean;
  color?: string;
}

interface LiveBannerProps {
  broadcasts?: LiveBroadcast[];
}

const defaultBroadcasts: LiveBroadcast[] = [
  {
    id: "1",
    title: "Matchday Live | Manchester United vs Liverpool",
    viewerCount: 6200,
    sourceName: "Sports Hub",
    sourceIcon: "⚽",
    isLive: true,
    color: "#FF0080",
  },
  {
    id: "2",
    title: "Breaking News: Tech Summit 2026",
    viewerCount: 1200,
    sourceName: "Tech News",
    sourceIcon: "📺",
    isLive: true,
    color: "#1DA1F2",
  },
];

export function LiveBanner({ broadcasts = defaultBroadcasts }: LiveBannerProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visibleBroadcasts = broadcasts.filter(b => !dismissed.includes(b.id));

  if (visibleBroadcasts.length === 0) {
    return null;
  }

  const handleDismiss = (id: string) => {
    setDismissed(prev => [...prev, id]);
  };

  return (
    <div className="border-b border-twitter-border-dark">
      {visibleBroadcasts.map((broadcast) => (
        <div
          key={broadcast.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3",
            "cursor-pointer",
            "transition-colors duration-200"
          )}
          style={{ backgroundColor: broadcast.color || "#FF0080" }}
        >
          {/* Source Icon */}
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/20 shrink-0">
            {broadcast.sourceIcon ? (
              <span className="text-lg">{broadcast.sourceIcon}</span>
            ) : (
              <Radio className="h-4 w-4 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white/80 text-xs font-medium">
                +{(broadcast.viewerCount / 1000).toFixed(1)}K
              </span>
              <span className="text-white text-sm truncate">
                {broadcast.title}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-full hover:bg-black/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-black border-twitter-border-dark">
                <DropdownMenuItem
                  onClick={() => handleDismiss(broadcast.id)}
                  className="text-white focus:bg-twitter-hover-dark"
                >
                  Not interested in this
                </DropdownMenuItem>
                <DropdownMenuItem className="text-white focus:bg-twitter-hover-dark">
                  See less often
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ChevronRight className="h-4 w-4 text-white/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
