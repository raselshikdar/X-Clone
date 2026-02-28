"use client";

import * as React from "react";
import Link from "next/link";
import { Search, X, CheckCircle2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/common/Avatar";
import { toast } from "sonner";

interface Member {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  verified: boolean;
  bio?: string | null;
  addedAt: string;
}

interface ListMembersProps {
  listId: string;
  isOwner: boolean;
  members: Member[];
  onAddMember?: (userId: string) => Promise<void>;
  onRemoveMember?: (userId: string) => Promise<void>;
}

export function ListMembers({
  listId,
  isOwner,
  members,
  onAddMember,
  onRemoveMember,
}: ListMembersProps) {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState<string | null>(null);
  const [isRemoving, setIsRemoving] = React.useState<string | null>(null);

  const searchUsers = React.useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search/users?q=${encodeURIComponent(query)}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  React.useEffect(() => {
    const debounce = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, searchUsers]);

  const handleAddMember = async (userId: string) => {
    if (!onAddMember) return;

    setIsAdding(userId);
    try {
      await onAddMember(userId);
      toast.success("Member added to list");
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    } finally {
      setIsAdding(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!onRemoveMember) return;

    setIsRemoving(userId);
    try {
      await onRemoveMember(userId);
      toast.success("Member removed from list");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
    } finally {
      setIsRemoving(null);
    }
  };

  // Filter out members already in the list from search results
  const memberIds = new Set(members.map((m) => m.id));
  const filteredResults = searchResults.filter(
    (user) => !memberIds.has(user.id)
  );

  return (
    <div className="space-y-4">
      {/* Members header with add button */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="font-bold text-lg">
          Members · {members.length.toLocaleString()}
        </h3>
        {isOwner && (
          <Button
            onClick={() => setShowAddModal(true)}
            variant="outline"
            className="rounded-full h-8 gap-2"
          >
            <UserPlus className="size-4" />
            Add member
          </Button>
        )}
      </div>

      {/* Members list */}
      <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
        {members.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-twitter-secondary dark:text-twitter-secondary-dark">
              No members in this list yet
            </p>
            {isOwner && (
              <Button
                onClick={() => setShowAddModal(true)}
                variant="outline"
                className="mt-4 rounded-full"
              >
                Add members
              </Button>
            )}
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
            >
              <Link href={`/${member.username}`} className="flex-shrink-0">
                <UserAvatar
                  src={member.avatar}
                  alt={member.displayName || member.username}
                  fallback={member.displayName || member.username}
                  size="lg"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/${member.username}`}
                  className="flex items-center gap-1 hover:underline"
                >
                  <span className="font-bold truncate">
                    {member.displayName || member.username}
                  </span>
                  {member.verified && (
                    <CheckCircle2 className="size-4 text-twitter-blue fill-twitter-blue flex-shrink-0" />
                  )}
                </Link>
                <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-sm truncate">
                  @{member.username}
                </p>
              </div>
              {isOwner && onRemoveMember && (
                <Button
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={isRemoving === member.id}
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full"
                >
                  {isRemoving === member.id ? "Removing..." : "Remove"}
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add member modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md p-0 gap-0">
          <DialogHeader className="p-4 border-b border-twitter-border dark:border-twitter-border-dark">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                Add member
              </DialogTitle>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 -mr-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>
          </DialogHeader>

          <div className="p-4">
            {/* Search input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-twitter-secondary dark:text-twitter-secondary-dark" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people"
                className="pl-10 h-12 rounded-full bg-twitter-gray dark:bg-twitter-gray-dark border-none"
              />
            </div>

            {/* Search results */}
            <div className="max-h-80 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-twitter-secondary dark:text-twitter-secondary-dark">
                  Searching...
                </div>
              ) : searchQuery && filteredResults.length === 0 ? (
                <div className="p-4 text-center text-twitter-secondary dark:text-twitter-secondary-dark">
                  {memberIds.size > 0
                    ? "No users found or all results are already members"
                    : "No users found"}
                </div>
              ) : (
                filteredResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark rounded-xl transition-colors"
                  >
                    <UserAvatar
                      src={user.avatar}
                      alt={user.displayName || user.username}
                      fallback={user.displayName || user.username}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-[15px] truncate">
                          {user.displayName || user.username}
                        </span>
                        {user.verified && (
                          <CheckCircle2 className="size-4 text-twitter-blue fill-twitter-blue flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-[13px] truncate">
                        @{user.username}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleAddMember(user.id)}
                      disabled={isAdding === user.id}
                      className="bg-black dark:bg-white text-white dark:text-black rounded-full font-bold h-8 px-4 text-[15px]"
                    >
                      {isAdding === user.id ? "Adding..." : "Add"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
