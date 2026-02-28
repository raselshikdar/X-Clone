import { create } from "zustand";

export interface TweetMedia {
  id: string;
  type: "image" | "video" | "gif";
  url: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  altText?: string;
}

export interface TweetAuthor {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  verified?: boolean;
  verifiedType?: string;
  bio?: string | null;
}

export interface Tweet {
  id: string;
  content: string | null;
  createdAt: Date;
  views: number;
  sensitiveContent?: boolean;
  author: TweetAuthor;
  media: TweetMedia[];
  _count: {
    likes: number;
    retweets: number;
    replies: number;
  };
  isLiked?: boolean;
  isRetweeted?: boolean;
  isBookmarked?: boolean;
  inReplyTo?: Tweet | null;
  quotedTweet?: Tweet | null;
}

interface TweetState {
  // Timeline tweets
  tweets: Tweet[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;

  // Current tweet detail
  currentTweet: Tweet | null;
  replies: Tweet[];

  // Actions
  fetchTimeline: (mode: "forYou" | "following", reset?: boolean) => Promise<void>;
  fetchTweet: (id: string) => Promise<Tweet | null>;
  fetchReplies: (tweetId: string, cursor?: string) => Promise<void>;
  createTweet: (data: {
    content?: string;
    media?: { type: string; url: string; thumbnail?: string }[];
    replyToId?: string;
    quoteToId?: string;
  }) => Promise<Tweet | null>;
  deleteTweet: (id: string) => Promise<boolean>;
  likeTweet: (id: string) => Promise<boolean>;
  unlikeTweet: (id: string) => Promise<boolean>;
  retweetTweet: (id: string) => Promise<boolean>;
  unretweetTweet: (id: string) => Promise<boolean>;
  bookmarkTweet: (id: string) => Promise<boolean>;
  unbookmarkTweet: (id: string) => Promise<boolean>;
  resetTimeline: () => void;
  clearCurrentTweet: () => void;

  // Optimistic updates
  optimisticLike: (id: string) => void;
  optimisticUnlike: (id: string) => void;
  optimisticRetweet: (id: string) => void;
  optimisticUnretweet: (id: string) => void;
  optimisticBookmark: (id: string) => void;
  optimisticUnbookmark: (id: string) => void;
  optimisticAddTweet: (tweet: Tweet) => void;
  optimisticDeleteTweet: (id: string) => void;
}

export const useTweetStore = create<TweetState>((set, get) => ({
  tweets: [],
  isLoading: false,
  error: null,
  hasMore: true,
  cursor: null,
  currentTweet: null,
  replies: [],

  fetchTimeline: async (mode: "forYou" | "following", reset = false) => {
    const { cursor, tweets } = get();

    if (reset) {
      set({ isLoading: true, error: null, cursor: null, tweets: [] });
    } else if (!get().hasMore && !reset) {
      return;
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const params = new URLSearchParams({
        mode,
        limit: "20",
      });

      if (!reset && cursor) {
        params.set("cursor", cursor);
      }

      const response = await fetch(`/api/tweets?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tweets");
      }

      const newTweets = data.tweets.map((t: Tweet) => ({
        ...t,
        createdAt: new Date(t.createdAt),
      }));

      set({
        tweets: reset ? newTweets : [...tweets, ...newTweets],
        cursor: data.nextCursor || null,
        hasMore: !!data.nextCursor,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch tweets",
        isLoading: false,
      });
    }
  },

  fetchTweet: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/tweets/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tweet");
      }

      const tweet = {
        ...data.tweet,
        createdAt: new Date(data.tweet.createdAt),
        inReplyTo: data.tweet.inReplyTo
          ? { ...data.tweet.inReplyTo, createdAt: new Date(data.tweet.inReplyTo.createdAt) }
          : null,
        quotedTweet: data.tweet.quotedTweet
          ? { ...data.tweet.quotedTweet, createdAt: new Date(data.tweet.quotedTweet.createdAt) }
          : null,
      };

      set({ currentTweet: tweet, isLoading: false });
      return tweet;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch tweet",
        isLoading: false,
      });
      return null;
    }
  },

  fetchReplies: async (tweetId: string, cursor?: string) => {
    try {
      const params = new URLSearchParams({
        tweetId,
        limit: "20",
      });

      if (cursor) {
        params.set("cursor", cursor);
      }

      const response = await fetch(`/api/tweets/${tweetId}/replies?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch replies");
      }

      const newReplies = data.replies.map((r: Tweet) => ({
        ...r,
        createdAt: new Date(r.createdAt),
      }));

      set({ replies: cursor ? [...get().replies, ...newReplies] : newReplies });
    } catch (error) {
      console.error("Error fetching replies:", error);
    }
  },

  createTweet: async (data) => {
    try {
      const response = await fetch("/api/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create tweet");
      }

      const tweet = {
        ...result.tweet,
        createdAt: new Date(result.tweet.createdAt),
      };

      // Add to timeline optimistically
      set({ tweets: [tweet, ...get().tweets] });

      return tweet;
    } catch (error) {
      console.error("Error creating tweet:", error);
      return null;
    }
  },

  deleteTweet: async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tweet");
      }

      // Remove from timeline optimistically
      set({
        tweets: get().tweets.filter((t) => t.id !== id),
        currentTweet: get().currentTweet?.id === id ? null : get().currentTweet,
      });

      return true;
    } catch (error) {
      console.error("Error deleting tweet:", error);
      return false;
    }
  },

  likeTweet: async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to like tweet");
      }

      return true;
    } catch (error) {
      console.error("Error liking tweet:", error);
      return false;
    }
  },

  unlikeTweet: async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}/like`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unlike tweet");
      }

      return true;
    } catch (error) {
      console.error("Error unliking tweet:", error);
      return false;
    }
  },

  retweetTweet: async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}/retweet`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to retweet");
      }

      return true;
    } catch (error) {
      console.error("Error retweeting:", error);
      return false;
    }
  },

  unretweetTweet: async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}/retweet`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unretweet");
      }

      return true;
    } catch (error) {
      console.error("Error unretweeting:", error);
      return false;
    }
  },

  bookmarkTweet: async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}/bookmark`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to bookmark tweet");
      }

      return true;
    } catch (error) {
      console.error("Error bookmarking tweet:", error);
      return false;
    }
  },

  unbookmarkTweet: async (id: string) => {
    try {
      const response = await fetch(`/api/tweets/${id}/bookmark`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unbookmark tweet");
      }

      return true;
    } catch (error) {
      console.error("Error unbookmarking tweet:", error);
      return false;
    }
  },

  resetTimeline: () => {
    set({ tweets: [], cursor: null, hasMore: true, error: null });
  },

  clearCurrentTweet: () => {
    set({ currentTweet: null, replies: [] });
  },

  // Optimistic updates
  optimisticLike: (id: string) => {
    const { tweets, currentTweet } = get();
    set({
      tweets: tweets.map((t) =>
        t.id === id
          ? {
              ...t,
              isLiked: true,
              _count: { ...t._count, likes: t._count.likes + 1 },
            }
          : t
      ),
      currentTweet:
        currentTweet?.id === id
          ? {
              ...currentTweet,
              isLiked: true,
              _count: { ...currentTweet._count, likes: currentTweet._count.likes + 1 },
            }
          : currentTweet,
    });
  },

  optimisticUnlike: (id: string) => {
    const { tweets, currentTweet } = get();
    set({
      tweets: tweets.map((t) =>
        t.id === id
          ? {
              ...t,
              isLiked: false,
              _count: { ...t._count, likes: Math.max(0, t._count.likes - 1) },
            }
          : t
      ),
      currentTweet:
        currentTweet?.id === id
          ? {
              ...currentTweet,
              isLiked: false,
              _count: {
                ...currentTweet._count,
                likes: Math.max(0, currentTweet._count.likes - 1),
              },
            }
          : currentTweet,
    });
  },

  optimisticRetweet: (id: string) => {
    const { tweets, currentTweet } = get();
    set({
      tweets: tweets.map((t) =>
        t.id === id
          ? {
              ...t,
              isRetweeted: true,
              _count: { ...t._count, retweets: t._count.retweets + 1 },
            }
          : t
      ),
      currentTweet:
        currentTweet?.id === id
          ? {
              ...currentTweet,
              isRetweeted: true,
              _count: {
                ...currentTweet._count,
                retweets: currentTweet._count.retweets + 1,
              },
            }
          : currentTweet,
    });
  },

  optimisticUnretweet: (id: string) => {
    const { tweets, currentTweet } = get();
    set({
      tweets: tweets.map((t) =>
        t.id === id
          ? {
              ...t,
              isRetweeted: false,
              _count: { ...t._count, retweets: Math.max(0, t._count.retweets - 1) },
            }
          : t
      ),
      currentTweet:
        currentTweet?.id === id
          ? {
              ...currentTweet,
              isRetweeted: false,
              _count: {
                ...currentTweet._count,
                retweets: Math.max(0, currentTweet._count.retweets - 1),
              },
            }
          : currentTweet,
    });
  },

  optimisticBookmark: (id: string) => {
    const { tweets, currentTweet } = get();
    set({
      tweets: tweets.map((t) => (t.id === id ? { ...t, isBookmarked: true } : t)),
      currentTweet:
        currentTweet?.id === id
          ? { ...currentTweet, isBookmarked: true }
          : currentTweet,
    });
  },

  optimisticUnbookmark: (id: string) => {
    const { tweets, currentTweet } = get();
    set({
      tweets: tweets.map((t) => (t.id === id ? { ...t, isBookmarked: false } : t)),
      currentTweet:
        currentTweet?.id === id
          ? { ...currentTweet, isBookmarked: false }
          : currentTweet,
    });
  },

  optimisticAddTweet: (tweet: Tweet) => {
    set({ tweets: [tweet, ...get().tweets] });
  },

  optimisticDeleteTweet: (id: string) => {
    set({
      tweets: get().tweets.filter((t) => t.id !== id),
      currentTweet: get().currentTweet?.id === id ? null : get().currentTweet,
    });
  },
}));
