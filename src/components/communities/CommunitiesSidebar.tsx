"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

interface SidebarCommunity {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  role: string;
}

export function CommunitiesSidebar() {
  const { isAuthenticated } = useAuth();
  const [communities, setCommunities] = useState<SidebarCommunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCommunities();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCommunities = async () => {
    try {
      const response = await fetch("/api/communities/my?limit=5");
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-twitter-border dark:border-twitter-border-dark overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between p-3",
          "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
          "transition-colors"
        )}
      >
        <h3 className="font-bold text-[17px]">Your Communities</h3>
        <ChevronRight
          className={cn(
            "size-5 text-twitter-secondary dark:text-twitter-secondary-dark transition-transform",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-twitter-border dark:border-twitter-border-dark">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : communities.length > 0 ? (
            <>
              {communities.map((community) => (
                <Link
                  key={community.id}
                  href={`/communities/${community.id}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2",
                    "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
                    "transition-colors"
                  )}
                >
                  <div className="size-8 rounded-lg bg-gradient-to-br from-twitter-blue to-blue-600 flex items-center justify-center overflow-hidden">
                    {community.icon ? (
                      <img
                        src={community.icon}
                        alt={community.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="size-4 text-white" />
                    )}
                  </div>
                  <span className="text-[15px] font-medium truncate">
                    {community.name}
                  </span>
                </Link>
              ))}
              <Link
                href="/communities"
                className={cn(
                  "block px-3 py-2 text-twitter-blue text-[14px]",
                  "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
                )}
              >
                See all communities
              </Link>
            </>
          ) : (
            <div className="p-3 text-center">
              <p className="text-[14px] text-twitter-secondary dark:text-twitter-secondary-dark mb-2">
                No communities yet
              </p>
              <Link href="/communities">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-[13px]"
                >
                  <Plus className="size-4 mr-1" />
                  Discover Communities
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
