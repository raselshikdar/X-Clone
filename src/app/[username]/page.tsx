"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { useUserStore, UserProfile } from "@/stores/userStore";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs, ProfileTab } from "@/components/profile/ProfileTabs";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { TweetCard, Tweet } from "@/components/common/TweetCard";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { profile, isLoadingProfile, fetchProfile } = useUserStore();
  const [activeTab, setActiveTab] = React.useState<ProfileTab>("tweets");
  const [tweets, setTweets] = React.useState<Tweet[]>([]);
  const [isLoadingTweets, setIsLoadingTweets] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [notFound, setNotFound] = React.useState(false);

  // Fetch profile on mount
  React.useEffect(() => {
    setNotFound(false);
    fetchProfile(username).then(() => {
      // Check if profile was not found
      const state = useUserStore.getState();
      if (!state.profile) {
        // Profile might still be loading
      }
    });
  }, [username, fetchProfile]);

  // Check for 404 after profile load
  React.useEffect(() => {
    if (!isLoadingProfile && !profile) {
      setNotFound(true);
    } else {
      setNotFound(false);
    }
  }, [isLoadingProfile, profile]);

  // Fetch tweets based on active tab
  const fetchTweets = React.useCallback(
    async (tab: ProfileTab, cursor?: string) => {
      if (!profile) return;

      setIsLoadingTweets(true);
      try {
        const endpoint =
          tab === "likes"
            ? `/api/users/${username}/likes`
            : `/api/users/${username}/tweets?tab=${tab}`;
        const url = `${endpoint}${cursor ? `&cursor=${cursor}` : ""}${
          !cursor ? `?limit=10` : `&limit=10`
        }`;

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const formattedTweets: Tweet[] = data.tweets.map((t: any) => ({
            id: t.id,
            user: {
              id: t.user.id,
              name: t.user.name,
              username: t.user.username,
              avatar: t.user.avatar,
              verified: t.user.verified,
            },
            content: t.content || "",
            media: t.media?.map((m: any) => ({
              id: m.id,
              type: m.type,
              url: m.url,
              thumbnail: m.thumbnail,
            })),
            createdAt: new Date(t.createdAt),
            replies: t.replies,
            retweets: t.retweets,
            likes: t.likes,
            views: t.views,
            isLiked: t.isLiked,
            isRetweeted: t.isRetweeted,
            isBookmarked: t.isBookmarked,
          }));

          if (cursor) {
            setTweets((prev) => [...prev, ...formattedTweets]);
          } else {
            setTweets(formattedTweets);
          }
          setNextCursor(data.nextCursor);
        }
      } catch (error) {
        console.error("Error fetching tweets:", error);
      } finally {
        setIsLoadingTweets(false);
      }
    },
    [profile, username]
  );

  // Fetch tweets when tab changes
  React.useEffect(() => {
    if (profile && !notFound) {
      setTweets([]);
      setNextCursor(null);
      fetchTweets(activeTab);
    }
  }, [activeTab, profile, fetchTweets, notFound]);

  const loadMoreTweets = () => {
    if (nextCursor && !isLoadingTweets) {
      fetchTweets(activeTab, nextCursor);
    }
  };

  // 404 state
  if (notFound) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark">
          <div className="flex items-center gap-6 p-2">
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Profile</h1>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 mt-16">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold mb-2">User not found</h2>
          <p className="text-twitter-secondary dark:text-twitter-secondary-dark">
            The user @{username} doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoadingProfile || !profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark">
          <div className="flex items-center gap-6 p-2">
            <Link
              href="/"
              className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
            >
              <ArrowLeft className="size-5" />
            </Link>
            <div>
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="animate-pulse">
          <div className="h-[200px] bg-gray-200 dark:bg-gray-800" />
          <div className="px-4 pb-4">
            <div className="-mt-16 mb-3">
              <div className="size-32 rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="space-y-3">
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Private profile and not following
  const showPrivateMessage =
    profile.isPrivate && !profile.isFollowing && !profile.isOwnProfile;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark">
        <div className="flex items-center gap-6 p-2">
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">
              {profile.displayName || profile.username}
            </h1>
            <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
              {profile.tweetsCount} Tweets
            </p>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <ProfileHeader
        profile={profile}
        onEditProfile={() => setEditModalOpen(true)}
      />

      {/* Private Profile Message */}
      {showPrivateMessage ? (
        <div className="p-4">
          <div className="flex items-center justify-center gap-2 py-8">
            <Lock className="size-5 text-twitter-secondary" />
            <p className="text-twitter-secondary dark:text-twitter-secondary-dark">
              Follow @{profile.username} to see their tweets.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <ProfileTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isOwnProfile={profile.isOwnProfile}
          />

          {/* Tweets */}
          <div>
            {isLoadingTweets && tweets.length === 0 ? (
              <div className="p-4 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-800" />
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                      <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded mb-1" />
                      <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tweets.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-twitter-secondary dark:text-twitter-secondary-dark">
                  {activeTab === "tweets" && "No tweets yet"}
                  {activeTab === "replies" && "No replies yet"}
                  {activeTab === "media" && "No media yet"}
                  {activeTab === "likes" && "No likes yet"}
                </p>
              </div>
            ) : (
              <>
                {tweets.map((tweet) => (
                  <TweetCard key={tweet.id} tweet={tweet} />
                ))}
                {nextCursor && (
                  <button
                    onClick={loadMoreTweets}
                    disabled={isLoadingTweets}
                    className="w-full p-4 text-twitter-blue hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
                  >
                    {isLoadingTweets ? "Loading..." : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={profile}
        onSuccess={() => {
          fetchProfile(username);
        }}
      />
    </div>
  );
}
