import { create } from 'zustand'

export interface TweetInteractionState {
  tweetId: string
  isLiked: boolean
  isRetweeted: boolean
  isBookmarked: boolean
  likesCount: number
  retweetsCount: number
  repliesCount: number
  viewsCount: number
}

interface InteractionState {
  // Map of tweetId to interaction state
  interactions: Map<string, TweetInteractionState>
  
  // Actions
  setInteraction: (tweetId: string, state: Partial<TweetInteractionState>) => void
  getInteraction: (tweetId: string) => TweetInteractionState | undefined
  
  // Optimistic updates
  toggleLike: (tweetId: string) => { wasLiked: boolean; previousState: TweetInteractionState | undefined }
  toggleRetweet: (tweetId: string) => { wasRetweeted: boolean; previousState: TweetInteractionState | undefined }
  toggleBookmark: (tweetId: string) => { wasBookmarked: boolean; previousState: TweetInteractionState | undefined }
  
  // Revert optimistic updates (on error)
  revertLike: (tweetId: string, previousState: TweetInteractionState | undefined) => void
  revertRetweet: (tweetId: string, previousState: TweetInteractionState | undefined) => void
  revertBookmark: (tweetId: string, previousState: TweetInteractionState | undefined) => void
  
  // Increment operations
  incrementReplies: (tweetId: string) => void
  incrementViews: (tweetId: string) => void
}

const DEFAULT_STATE: Omit<TweetInteractionState, 'tweetId'> = {
  isLiked: false,
  isRetweeted: false,
  isBookmarked: false,
  likesCount: 0,
  retweetsCount: 0,
  repliesCount: 0,
  viewsCount: 0,
}

export const useInteractionStore = create<InteractionState>((set, get) => ({
  interactions: new Map(),
  
  setInteraction: (tweetId, state) => {
    set((prev) => {
      const newMap = new Map(prev.interactions)
      const existing = newMap.get(tweetId)
      newMap.set(tweetId, {
        tweetId,
        ...DEFAULT_STATE,
        ...existing,
        ...state,
      })
      return { interactions: newMap }
    })
  },
  
  getInteraction: (tweetId) => {
    return get().interactions.get(tweetId)
  },
  
  toggleLike: (tweetId) => {
    const previousState = get().interactions.get(tweetId)
    const wasLiked = previousState?.isLiked ?? false
    
    set((prev) => {
      const newMap = new Map(prev.interactions)
      const existing = newMap.get(tweetId)
      newMap.set(tweetId, {
        tweetId,
        ...DEFAULT_STATE,
        ...existing,
        isLiked: !wasLiked,
        likesCount: wasLiked 
          ? Math.max(0, (existing?.likesCount ?? 1) - 1)
          : (existing?.likesCount ?? 0) + 1,
      })
      return { interactions: newMap }
    })
    
    return { wasLiked, previousState }
  },
  
  toggleRetweet: (tweetId) => {
    const previousState = get().interactions.get(tweetId)
    const wasRetweeted = previousState?.isRetweeted ?? false
    
    set((prev) => {
      const newMap = new Map(prev.interactions)
      const existing = newMap.get(tweetId)
      newMap.set(tweetId, {
        tweetId,
        ...DEFAULT_STATE,
        ...existing,
        isRetweeted: !wasRetweeted,
        retweetsCount: wasRetweeted 
          ? Math.max(0, (existing?.retweetsCount ?? 1) - 1)
          : (existing?.retweetsCount ?? 0) + 1,
      })
      return { interactions: newMap }
    })
    
    return { wasRetweeted, previousState }
  },
  
  toggleBookmark: (tweetId) => {
    const previousState = get().interactions.get(tweetId)
    const wasBookmarked = previousState?.isBookmarked ?? false
    
    set((prev) => {
      const newMap = new Map(prev.interactions)
      const existing = newMap.get(tweetId)
      newMap.set(tweetId, {
        tweetId,
        ...DEFAULT_STATE,
        ...existing,
        isBookmarked: !wasBookmarked,
      })
      return { interactions: newMap }
    })
    
    return { wasBookmarked, previousState }
  },
  
  revertLike: (tweetId, previousState) => {
    if (previousState) {
      set((prev) => {
        const newMap = new Map(prev.interactions)
        newMap.set(tweetId, previousState)
        return { interactions: newMap }
      })
    } else {
      get().toggleLike(tweetId)
    }
  },
  
  revertRetweet: (tweetId, previousState) => {
    if (previousState) {
      set((prev) => {
        const newMap = new Map(prev.interactions)
        newMap.set(tweetId, previousState)
        return { interactions: newMap }
      })
    } else {
      get().toggleRetweet(tweetId)
    }
  },
  
  revertBookmark: (tweetId, previousState) => {
    if (previousState) {
      set((prev) => {
        const newMap = new Map(prev.interactions)
        newMap.set(tweetId, previousState)
        return { interactions: newMap }
      })
    } else {
      get().toggleBookmark(tweetId)
    }
  },
  
  incrementReplies: (tweetId) => {
    set((prev) => {
      const newMap = new Map(prev.interactions)
      const existing = newMap.get(tweetId)
      newMap.set(tweetId, {
        tweetId,
        ...DEFAULT_STATE,
        ...existing,
        repliesCount: (existing?.repliesCount ?? 0) + 1,
      })
      return { interactions: newMap }
    })
  },
  
  incrementViews: (tweetId) => {
    set((prev) => {
      const newMap = new Map(prev.interactions)
      const existing = newMap.get(tweetId)
      newMap.set(tweetId, {
        tweetId,
        ...DEFAULT_STATE,
        ...existing,
        viewsCount: (existing?.viewsCount ?? 0) + 1,
      })
      return { interactions: newMap }
    })
  },
}))
