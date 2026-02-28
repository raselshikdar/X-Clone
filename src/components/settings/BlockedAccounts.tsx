"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Ban, MoreHorizontal } from "lucide-react";
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

interface BlockedUser {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  bio: string | null;
  verified: boolean;
  blockedAt: string;
}

interface BlockedAccountsProps {
  initialUsers?: BlockedUser[];
}

export function BlockedAccounts({ initialUsers = [] }: BlockedAccountsProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [users, setUsers] = React.useState<BlockedUser[]>(initialUsers);
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch blocked users
  const fetchBlockedUsers = React.useCallback(async (search?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const response = await fetch(`/api/settings/blocked?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search with debounce
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchBlockedUsers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, fetchBlockedUsers]);

  // Unblock user
  const handleUnblock = async (userId: string) => {
    try {
      const response = await fetch(`/api/settings/blocked?userId=${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        toast({
          title: "User unblocked",
          description: "The user has been unblocked.",
        });
      } else {
        throw new Error("Failed to unblock");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to unblock user. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-twitter-secondary" />
          <Input
            placeholder="Search blocked accounts"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Blocked Users List */}
      <div className="max-h-[60vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-twitter-secondary">
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Ban className="size-12 mx-auto text-twitter-secondary mb-3" />
            <p className="font-semibold text-lg">No blocked accounts</p>
            <p className="text-twitter-secondary text-sm mt-1">
              {searchQuery
                ? "No accounts match your search."
                : "You haven't blocked any accounts yet."}
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
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(user.id)}
                >
                  Unblock
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
                      onClick={() => handleUnblock(user.id)}
                    >
                      Unblock
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
