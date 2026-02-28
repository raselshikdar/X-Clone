"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ListCard } from "@/components/lists";
import { ProfileHeader } from "@/components/profile/ProfileHeader";

interface List {
  id: string;
  name: string;
  description?: string | null;
  isPrivate: boolean;
  memberCount: number;
  isOwner: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  verified: boolean;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
  isPrivate: boolean;
  isFollowing: boolean;
}

export default function UserListsPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [lists, setLists] = React.useState<List[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile
        const profileResponse = await fetch(`/api/users/${username}`);
        if (!profileResponse.ok) {
          router.push("/");
          return;
        }
        const profileData = await profileResponse.json();
        setProfile(profileData.user);

        // Fetch lists
        const listsResponse = await fetch(`/api/lists?username=${username}`);
        if (listsResponse.ok) {
          const listsData = await listsResponse.json();
          setLists(listsData.lists);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [username, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark p-4">
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark">
        <div className="flex items-center gap-6 p-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{profile.displayName || profile.username}</h1>
            <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
              @{profile.username}
            </p>
          </div>
        </div>
      </div>

      {/* Tab header */}
      <div className="border-b border-twitter-border dark:border-twitter-border-dark">
        <div className="px-4 py-3">
          <h2 className="font-bold text-lg">Lists</h2>
          <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
            {lists.length} {lists.length === 1 ? "list" : "lists"}
          </p>
        </div>
      </div>

      {/* Lists */}
      <div className="max-w-2xl">
        {lists.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-twitter-secondary dark:text-twitter-secondary-dark">
              @{username} hasn&apos;t created any public lists yet
            </p>
          </div>
        ) : (
          lists.map((list) => (
            <ListCard
              key={list.id}
              {...list}
              showActions={false}
            />
          ))
        )}
      </div>
    </div>
  );
}
