"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Lock,
  Globe,
  Calendar,
  Settings,
  MoreHorizontal,
  Shield,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface CommunityHeaderData {
  id: string;
  name: string;
  description: string | null;
  banner: string | null;
  icon: string | null;
  isPrivate: boolean;
  rules: string[];
  memberCount: number;
  tweetCount: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  owner: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
  };
  isOwner: boolean;
  isJoined: boolean;
  role: string | null;
}

interface CommunityHeaderProps {
  community: CommunityHeaderData;
  onJoin?: () => void;
  onLeave?: () => void;
  onDelete?: () => void;
  onBannerChange?: (banner: string) => void;
  isJoining?: boolean;
  isLeaving?: boolean;
}

function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function CommunityHeader({
  community,
  onJoin,
  onLeave,
  onDelete,
  onBannerChange,
  isJoining = false,
  isLeaving = false,
}: CommunityHeaderProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBannerClick = () => {
    if (community.isOwner && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app, upload to storage and get URL
    // For now, we'll use a data URL
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      onBannerChange?.(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const isAdmin = community.role === "admin" || community.role === "owner";

  return (
    <header className="relative">
      {/* Hidden file input for banner upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Banner */}
      <div
        onClick={handleBannerClick}
        className={cn(
          "relative h-48 md:h-64 w-full bg-twitter-hover dark:bg-twitter-hover-dark",
          community.isOwner && "cursor-pointer hover:opacity-90"
        )}
      >
        {community.banner ? (
          <img
            src={community.banner}
            alt={community.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900">
            {community.isPrivate ? (
              <Lock className="size-16 text-gray-400 dark:text-gray-600" />
            ) : (
              <Globe className="size-16 text-gray-400 dark:text-gray-600" />
            )}
          </div>
        )}
        {community.isOwner && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
            <span className="text-white opacity-0 hover:opacity-100 text-sm font-medium">
              Change banner
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        {/* Actions row */}
        <div className="flex items-center justify-between -mt-8 mb-4">
          {/* Icon */}
          <div className="relative">
            <div
              className={cn(
                "size-24 rounded-2xl border-4 border-white dark:border-black",
                "bg-gradient-to-br from-twitter-blue to-blue-600",
                "flex items-center justify-center overflow-hidden"
              )}
            >
              {community.icon ? (
                <img
                  src={community.icon}
                  alt={community.name}
                  className="w-full h-full object-cover"
                />
              ) : community.isPrivate ? (
                <Lock className="size-10 text-white" />
              ) : (
                <Globe className="size-10 text-white" />
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-12">
            {isAdmin && (
              <Link href={`/communities/${community.id}/settings`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-twitter-border dark:border-twitter-border-dark"
                >
                  <Settings className="size-5" />
                </Button>
              </Link>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-twitter-border dark:border-twitter-border-dark"
                >
                  <MoreHorizontal className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Shield className="size-4 mr-2" />
                  Report community
                </DropdownMenuItem>
                {community.isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-500"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      Delete community
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {!community.isOwner && (
              <Button
                variant={community.isJoined ? "outline" : "default"}
                onClick={() => community.isJoined ? onLeave?.() : onJoin?.()}
                disabled={isJoining || isLeaving}
                className={cn(
                  "rounded-full font-bold px-6",
                  community.isJoined
                    ? "border-twitter-border dark:border-twitter-border-dark hover:border-red-500 hover:text-red-500"
                    : "bg-twitter-blue hover:bg-twitter-blue/90"
                )}
              >
                {isJoining || isLeaving ? (
                  <div className="size-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : community.isJoined ? (
                  "Joined"
                ) : (
                  "Join"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Name and info */}
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            {community.name}
            {community.isPrivate && (
              <Lock className="size-5 text-twitter-secondary" />
            )}
          </h1>

          {community.description && (
            <p className="text-[15px] mt-2 whitespace-pre-wrap">
              {community.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-twitter-secondary dark:text-twitter-secondary-dark text-[14px]">
            <Link
              href={`/communities/${community.id}/members`}
              className="flex items-center gap-1 hover:underline"
            >
              <Users className="size-4" />
              <span>
                <strong className="text-black dark:text-white">
                  {community.memberCount.toLocaleString()}
                </strong>{" "}
                Members
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <Calendar className="size-4" />
              <span>Created {formatDate(community.createdAt)}</span>
            </div>
          </div>

          {/* Owner */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[14px]">
              Created by
            </span>
            <Link
              href={`/${community.owner.username}`}
              className="flex items-center gap-1 hover:underline"
            >
              <UserAvatar
                src={community.owner.avatar}
                alt={community.owner.displayName || community.owner.username}
                fallback={community.owner.displayName || community.owner.username}
                size="xs"
              />
              <span className="font-medium text-[14px]">
                @{community.owner.username}
              </span>
              {community.owner.verified && (
                <Crown className="size-4 text-twitter-blue fill-twitter-blue" />
              )}
            </Link>
          </div>

          {/* Role badge for admins */}
          {isAdmin && (
            <div className="mt-3">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-medium",
                  community.isOwner
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
                )}
              >
                <Crown className="size-3" />
                {community.isOwner ? "Owner" : "Admin"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Community?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              community &quot;{community.name}&quot; and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteDialog(false);
                onDelete?.();
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
