"use client";

import * as React from "react";
import Link from "next/link";
import { Search, VolumeX, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface MutedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  verified: boolean;
  mutedAt: string;
}

interface MutedAccountsProps {
  initialUsers?: MutedUser[];
}

export function MutedAccounts({ initialUsers = [] }: MutedAccountsProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [users, setUsers] = React.useState<MutedUser[]>(initialUsers);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch muted users
  const fetchMutedUsers = React.useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const response = await fetch(`/api/settings/muted?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching muted users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchMutedUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchMutedUsers]);

  // Unmute user
  const handleUnmute = async (userId: string) => {
    try {
      const response = await fetch(`/api/settings/muted?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast({
          title: "User unmuted",
          description: "The user has been unmuted. You will now see their posts.",
        });
      } else {
        throw new Error("Failed to unmute");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unmute user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const mutedAt = new Date(date);
    const diffMs = now.getTime() - mutedAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return mutedAt.toLocaleDateString();
  };

  return (
    <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-twitter-secondary" />
          <Input
            placeholder="Search muted accounts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 bg-twitter-gray/10 dark:bg-twitter-gray-dark/10">
        <p className="text-sm text-twitter-secondary">
          Muted accounts won't know you've muted them. You can unmute them at any time.
        </p>
      </div>

      {/* Muted Users List */}
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-twitter-secondary">
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <VolumeX className="size-12 mx-auto text-twitter-secondary mb-3" />
            <p className="font-semibold text-lg">No muted accounts</p>
            <p className="text-twitter-secondary text-sm mt-1">
              {searchQuery
                ? "No accounts match your search."
                : "You haven't muted any accounts yet."}
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
            >
              <Link href={`/${user.username}`} className="flex-shrink-0">
                <Avatar className="size-10">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback>
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <Link href={`/${user.username}`} className="hover:underline">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold truncate">
                      {user.displayName || user.username}
                    </span>
                    {user.verified && (
                      <span className="text-twitter-blue text-sm">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-twitter-secondary">@{user.username}</p>
                </Link>
                <p className="text-xs text-twitter-secondary mt-0.5">
                  Muted {formatRelativeTime(user.mutedAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnmute(user.id)}
                >
                  Unmute
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/${user.username}`}>View profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => handleUnmute(user.id)}
                    >
                      Unmute
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
