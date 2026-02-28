"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/common/Avatar";
import type { ConversationUser } from "@/hooks/useConversations";

interface NewMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recentContacts?: ConversationUser[];
}

// Mock function to search users - in real app this would call an API
async function searchUsers(query: string): Promise<ConversationUser[]> {
  // This would be an API call in production
  const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  return response.json();
}

export function NewMessageModal({
  open,
  onOpenChange,
  recentContacts = [],
}: NewMessageModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<ConversationUser[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<ConversationUser | null>(null);

  // Search users when query changes
  React.useEffect(() => {
    const search = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSelectUser = (user: ConversationUser) => {
    setSelectedUser(user);
    // Navigate to conversation
    router.push(`/messages/${user.id}`);
    onOpenChange(false);
    resetState();
  };

  const resetState = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetState();
    }
  };

  const displayUsers = searchQuery.trim() ? searchResults : recentContacts;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-white dark:bg-black">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-twitter-border dark:border-twitter-border-dark">
          <button
            onClick={() => handleOpenChange(false)}
            className="p-2 -ml-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
          >
            <X className="size-5" />
          </button>
          <DialogTitle className="text-xl font-bold">New message</DialogTitle>
          <div className="w-9" /> {/* Spacer for alignment */}
        </DialogHeader>

        {/* Search Input */}
        <div className="p-4">
          <div className="flex items-center gap-3 p-3 bg-twitter-hover dark:bg-twitter-hover-dark rounded-lg">
            <Search className="size-5 text-twitter-secondary dark:text-twitter-secondary-dark flex-shrink-0" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people"
              className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-[15px] placeholder:text-twitter-secondary dark:placeholder:text-twitter-secondary-dark"
            />
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="max-h-80">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin size-6 border-2 border-twitter-blue border-t-transparent rounded-full" />
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
              <div className="size-16 rounded-full bg-twitter-hover dark:bg-twitter-hover-dark flex items-center justify-center mb-4">
                <UserPlus className="size-8 text-twitter-secondary dark:text-twitter-secondary-dark" />
              </div>
              <p className="text-twitter-secondary dark:text-twitter-secondary-dark">
                {searchQuery.trim()
                  ? `No users found for "${searchQuery}"`
                  : "Search for people to start a conversation"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
              {!searchQuery.trim() && recentContacts.length > 0 && (
                <p className="px-4 py-2 text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark font-medium">
                  Recent
                </p>
              )}
              {displayUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4",
                    "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
                    "transition-colors duration-200"
                  )}
                >
                  <UserAvatar
                    src={user.avatar}
                    alt={user.displayName || user.username}
                    fallback={user.displayName || user.username}
                    size="lg"
                  />
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-[15px] truncate">
                        {user.displayName || user.username}
                      </span>
                      {user.verified && (
                        <svg
                          className="size-[18px] text-twitter-blue flex-shrink-0"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px]">
                      @{user.username}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
