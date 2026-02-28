import { create } from "zustand";

export type VerificationType = "blue" | "gold" | "gray" | "government";

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  banner: string | null;
  location: string | null;
  website: string | null;
  birthDate: Date | null;
  verified: boolean;
  verifiedAt: Date | null;
  verificationStatus: string;
  verification: {
    type: VerificationType;
    verifiedAt: Date;
  } | null;
  isPrivate: boolean;
  createdAt: Date;
  followersCount: number;
  followingCount: number;
  tweetsCount: number;
  isFollowing?: boolean;
  isBlocked?: boolean;
  isOwnProfile?: boolean;
  canViewFullProfile?: boolean;
}

export interface CurrentUser extends UserProfile {
  email: string;
  settings?: {
    darkMode: boolean;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    dmFromAnyone: boolean;
    showReadReceipts: boolean;
    allowTagging: boolean;
  } | null;
}

interface UserState {
  // Current authenticated user
  currentUser: CurrentUser | null;
  isLoadingCurrentUser: boolean;

  // Profile data for viewed users
  profile: UserProfile | null;
  isLoadingProfile: boolean;

  // Actions
  fetchCurrentUser: () => Promise<void>;
  updateCurrentUser: (data: Partial<CurrentUser>) => Promise<void>;
  fetchProfile: (username: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  followUser: (username: string) => Promise<{ success: boolean; pending?: boolean }>;
  unfollowUser: (username: string) => Promise<{ success: boolean }>;
  clearProfile: () => void;
  clearCurrentUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  isLoadingCurrentUser: false,
  profile: null,
  isLoadingProfile: false,

  fetchCurrentUser: async () => {
    set({ isLoadingCurrentUser: true });
    try {
      const response = await fetch("/api/users/me");
      if (response.ok) {
        const user = await response.json();
        set({ currentUser: user, isLoadingCurrentUser: false });
      } else {
        set({ currentUser: null, isLoadingCurrentUser: false });
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      set({ currentUser: null, isLoadingCurrentUser: false });
    }
  },

  updateCurrentUser: async (data: Partial<CurrentUser>) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const response = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        set({ currentUser: { ...currentUser, ...updatedUser } });
      }
    } catch (error) {
      console.error("Error updating current user:", error);
    }
  },

  fetchProfile: async (username: string) => {
    set({ isLoadingProfile: true, profile: null });
    try {
      const response = await fetch(`/api/users/${username}`);
      if (response.ok) {
        const profile = await response.json();
        set({ profile, isLoadingProfile: false });
      } else {
        set({ profile: null, isLoadingProfile: false });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      set({ profile: null, isLoadingProfile: false });
    }
  },

  updateProfile: async (data: Partial<UserProfile>) => {
    const { profile } = get();
    if (!profile) return;

    try {
      const response = await fetch(`/api/users/${profile.username}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        set({ profile: { ...profile, ...updatedProfile } });

        // Also update current user if updating own profile
        const { currentUser } = get();
        if (currentUser && currentUser.id === profile.id) {
          set({ currentUser: { ...currentUser, ...updatedProfile } });
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  },

  followUser: async (username: string) => {
    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();

        // Update profile if viewing that user
        const { profile } = get();
        if (profile && profile.username === username) {
          set({
            profile: {
              ...profile,
              isFollowing: true,
              followersCount: profile.followersCount + 1,
            },
          });
        }

        return { success: true, pending: result.pending };
      }
      return { success: false };
    } catch (error) {
      console.error("Error following user:", error);
      return { success: false };
    }
  },

  unfollowUser: async (username: string) => {
    try {
      const response = await fetch(`/api/users/${username}/follow`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Update profile if viewing that user
        const { profile } = get();
        if (profile && profile.username === username) {
          set({
            profile: {
              ...profile,
              isFollowing: false,
              followersCount: Math.max(0, profile.followersCount - 1),
            },
          });
        }

        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Error unfollowing user:", error);
      return { success: false };
    }
  },

  clearProfile: () => set({ profile: null }),
  clearCurrentUser: () => set({ currentUser: null }),
}));
