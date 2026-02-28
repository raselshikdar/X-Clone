"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/Avatar";
import { useUserStore } from "@/stores/userStore";

interface UserItem {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  verified: boolean;
  bio: string | null;
  isPrivate: boolean;
  isFollowing: boolean;
  followedAt?: string;
}

interface FollowingListProps {
  username: string;
}

export function FollowingList({ username }: FollowingListProps) {
  const router = useRouter();
  const { followUser, unfollowUser } = useUserStore();
  const [users, setUsers] = React.useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState<string | null>(null);

  const fetchUsers = React.useCallback(
    async (cursor?: string) => {
      try {
        const url = `/api/users/${username}/following?limit=20${
          cursor ? `&cursor=${cursor}` : ""
        }`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (cursor) {
            setUsers((prev) => [...prev, ...data.users]);
          } else {
            setUsers(data.users);
          }
          setNextCursor(data.nextCursor);
        }
      } catch (error) {
        console.error("Error fetching following:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [username]
  );

  React.useEffect(() => {
    setIsLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    setFollowLoading(userId);
    try {
      if (currentlyFollowing) {
        const result = await unfollowUser(user.username);
        if (result.success) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, isFollowing: false } : u
            )
          );
        }
      } else {
        const result = await followUser(user.username);
        if (result.success) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === userId ? { ...u, isFollowing: true } : u
            )
          );
        }
      }
    } finally {
      setFollowLoading(null);
    }
  };

  const loadMore = () => {
    if (nextCursor && !isLoadingMore) {
      setIsLoadingMore(true);
      fetchUsers(nextCursor);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <Header username={username} />
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="size-12 rounded-full bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Header username={username} />
      <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-twitter-secondary dark:text-twitter-secondary-dark">
              Not following anyone yet
            </p>
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user.id}
              className="flex items-start gap-3 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
            >
              <Link href={`/${user.username}`}>
                <UserAvatar
                  src={user.avatar}
                  alt={user.displayName || user.username}
                  fallback={user.displayName || user.username}
                  size="lg"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/${user.username}`}
                      className="font-bold hover:underline truncate"
                    >
                      {user.displayName || user.username}
                    </Link>
                    {user.verified && (
                      <CheckCircle2 className="size-4 text-twitter-blue fill-twitter-blue" />
                    )}
                  </div>
                  <Button
                    onClick={() => handleFollow(user.id, user.isFollowing)}
                    disabled={followLoading === user.id}
                    variant={user.isFollowing ? "outline" : "default"}
                    className={cn(
                      "rounded-full min-w-[80px] h-8",
                      user.isFollowing
                        ? "border-gray-300 dark:border-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-500 dark:hover:bg-red-500/10"
                        : "bg-black dark:bg-white text-white dark:text-black"
                    )}
                  >
                    {user.isFollowing ? "Following" : "Follow"}
                  </Button>
                </div>
                <Link
                  href={`/${user.username}`}
                  className="text-twitter-secondary dark:text-twitter-secondary-dark text-sm"
                >
                  @{user.username}
                </Link>
                {user.bio && (
                  <p className="text-sm mt-1 line-clamp-2">{user.bio}</p>
                )}
              </div>
            </div>
          ))
        )}
        {nextCursor && (
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="w-full p-4 text-twitter-blue hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
          >
            {isLoadingMore ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}

function Header({ username }: { username: string }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark">
      <div className="flex items-center gap-6 p-2">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{username}</h1>
          <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
            Following
          </p>
        </div>
      </div>
    </div>
  );
}
