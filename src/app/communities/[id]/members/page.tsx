"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Crown, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CommunityTabs,
  CommunityMembers,
  type CommunityMemberData,
} from "@/components/communities";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function CommunityMembersPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;
  const { user: currentUser } = useAuth();

  const [members, setMembers] = useState<CommunityMemberData[]>([]);
  const [communityName, setCommunityName] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; displayName: string | null; avatar: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchCommunity();
    fetchMembers(1);
  }, [communityId]);

  const fetchCommunity = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      if (response.ok) {
        const data = await response.json();
        setCommunityName(data.community.name);
        setCurrentUserRole(data.community.role);
      }
    } catch (error) {
      console.error("Error fetching community:", error);
    }
  };

  const fetchMembers = async (pageNum: number) => {
    try {
      setLoading(pageNum === 1);
      const response = await fetch(
        `/api/communities/${communityId}/members?page=${pageNum}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        if (pageNum === 1) {
          setMembers(data.members);
        } else {
          setMembers((prev) => [...prev, ...data.members]);
        }
        setHasMore(data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (userId: string) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.user.id === userId ? { ...m, role: "admin" } : m
          )
        );
        toast.success("Member promoted to admin");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to promote member");
      }
    } catch (error) {
      toast.error("Failed to promote member");
    }
  };

  const handleDemote = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/communities/${communityId}/admins?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.user.id === userId ? { ...m, role: "member" } : m
          )
        );
        toast.success("Admin demoted to member");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to demote admin");
      }
    } catch (error) {
      toast.error("Failed to demote admin");
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      const response = await fetch(
        `/api/communities/${communityId}/members?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setMembers((prev) => prev.filter((m) => m.user.id !== userId));
        toast.success("Member removed from community");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const handleSearchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/search/users?q=${encodeURIComponent(query)}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        // Filter out members already in community
        const memberIds = new Set(members.map((m) => m.user.id));
        setSearchResults(data.users.filter((u: { id: string }) => !memberIds.has(u.id)));
      }
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/communities/${communityId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setMembers((prev) => [data.member, ...prev]);
        setShowAddModal(false);
        setSearchUsers("");
        setSearchResults([]);
        toast.success("Member added to community");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add member");
      }
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchMembers(page + 1);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Back button */}
      <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-20 px-4 py-2 flex items-center gap-6 border-b border-twitter-border dark:border-twitter-border-dark">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-bold text-lg">{communityName}</h1>
      </div>

      {/* Tabs */}
      <CommunityTabs communityId={communityId} />

      {/* Members */}
      {loading && members.length === 0 ? (
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <CommunityMembers
          members={members}
          currentUserId={currentUser?.id}
          currentUserRole={currentUserRole}
          onPromote={handlePromote}
          onDemote={handleDemote}
          onRemove={handleRemove}
          onAddMember={() => setShowAddModal(true)}
          hasMore={hasMore}
          onLoadMore={loadMore}
          isLoading={loading}
        />
      )}

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={searchUsers}
              onChange={(e) => {
                setSearchUsers(e.target.value);
                handleSearchUsers(e.target.value);
              }}
              placeholder="Search users..."
              className="rounded-full"
            />

            {searching ? (
              <div className="flex justify-center py-4">
                <div className="size-6 border-2 border-twitter-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-64 overflow-y-auto divide-y divide-twitter-border dark:divide-twitter-border-dark">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAddMember(user.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
                  >
                    <div className="size-10 rounded-full bg-twitter-hover dark:bg-twitter-hover-dark flex items-center justify-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.displayName || user.username}
                          className="size-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold">
                          {(user.displayName || user.username).charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-bold text-[15px]">
                        {user.displayName || user.username}
                      </div>
                      <div className="text-twitter-secondary dark:text-twitter-secondary-dark text-[13px]">
                        @{user.username}
                      </div>
                    </div>
                    <Button size="sm" className="rounded-full bg-twitter-blue">
                      Add
                    </Button>
                  </button>
                ))}
              </div>
            ) : searchUsers && (
              <p className="text-center py-4 text-twitter-secondary dark:text-twitter-secondary-dark">
                No users found
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
