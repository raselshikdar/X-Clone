"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, Shield, UserPlus, UserMinus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/common/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CommunityMemberData {
  id: string;
  role: "owner" | "admin" | "member";
  joinedAt: Date | string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
    bio?: string | null;
  };
}

interface CommunityMembersProps {
  members: CommunityMemberData[];
  currentUserId?: string;
  currentUserRole?: string | null;
  onPromote?: (userId: string) => void;
  onDemote?: (userId: string) => void;
  onRemove?: (userId: string) => void;
  onAddMember?: () => void;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function CommunityMembers({
  members,
  currentUserId,
  currentUserRole,
  onPromote,
  onDemote,
  onRemove,
  onAddMember,
  hasMore = false,
  onLoadMore,
  isLoading = false,
}: CommunityMembersProps) {
  const [search, setSearch] = useState("");

  const canManageMembers = currentUserRole === "owner" || currentUserRole === "admin";
  const isOwner = currentUserRole === "owner";

  const filteredMembers = members.filter(
    (member) =>
      member.user.username.toLowerCase().includes(search.toLowerCase()) ||
      member.user.displayName?.toLowerCase().includes(search.toLowerCase())
  );

  const roleOrder = { owner: 0, admin: 1, member: 2 };
  const sortedMembers = [...filteredMembers].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role]
  );

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex items-center gap-3 px-4">
        <div className="flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members..."
            className="rounded-full"
          />
        </div>
        {canManageMembers && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddMember}
            className="rounded-full"
          >
            <UserPlus className="size-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Members list */}
      <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
        {sortedMembers.map((member) => {
          const isCurrentUser = member.user.id === currentUserId;
          const canPromote = isOwner && member.role === "member";
          const canDemote = isOwner && member.role === "admin";
          const canRemove =
            (isOwner && member.role !== "owner") ||
            (currentUserRole === "admin" && member.role === "member");

          return (
            <div
              key={member.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
            >
              <Link href={`/${member.user.username}`}>
                <UserAvatar
                  src={member.user.avatar}
                  alt={member.user.displayName || member.user.username}
                  fallback={member.user.displayName || member.user.username}
                  size="md"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${member.user.username}`}
                    className="font-bold text-[15px] hover:underline truncate"
                  >
                    {member.user.displayName || member.user.username}
                  </Link>
                  {member.user.verified && (
                    <Crown className="size-4 text-twitter-blue fill-twitter-blue" />
                  )}
                  {/* Role badge */}
                  {member.role !== "member" && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
                        member.role === "owner"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
                      )}
                    >
                      {member.role === "owner" ? (
                        <Crown className="size-3" />
                      ) : (
                        <Shield className="size-3" />
                      )}
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-twitter-secondary dark:text-twitter-secondary-dark text-[13px]">
                  <span>@{member.user.username}</span>
                  <span>·</span>
                  <span>Joined {formatDate(member.joinedAt)}</span>
                </div>
                {member.user.bio && (
                  <p className="text-[14px] text-twitter-secondary dark:text-twitter-secondary-dark line-clamp-1 mt-0.5">
                    {member.user.bio}
                  </p>
                )}
              </div>

              {/* Actions */}
              {!isCurrentUser && canManageMembers && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full size-8"
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {canPromote && (
                      <DropdownMenuItem onClick={() => onPromote?.(member.user.id)}>
                        <Shield className="size-4 mr-2" />
                        Promote to Admin
                      </DropdownMenuItem>
                    )}
                    {canDemote && (
                      <DropdownMenuItem onClick={() => onDemote?.(member.user.id)}>
                        <UserMinus className="size-4 mr-2" />
                        Demote to Member
                      </DropdownMenuItem>
                    )}
                    {canRemove && (canPromote || canDemote) && <DropdownMenuSeparator />}
                    {canRemove && (
                      <DropdownMenuItem
                        className="text-red-500"
                        onClick={() => onRemove?.(member.user.id)}
                      >
                        <UserMinus className="size-4 mr-2" />
                        Remove from Community
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <Button
            variant="ghost"
            onClick={onLoadMore}
            disabled={isLoading}
            className="text-twitter-blue"
          >
            {isLoading ? (
              <div className="size-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}

      {sortedMembers.length === 0 && (
        <div className="text-center py-12 text-twitter-secondary dark:text-twitter-secondary-dark">
          {search ? "No members found" : "No members yet"}
        </div>
      )}
    </div>
  );
}
