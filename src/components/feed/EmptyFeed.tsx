"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sparkles, UserPlus, Search } from "lucide-react";

interface EmptyFeedProps {
  type: "forYou" | "following";
  isAuthenticated?: boolean;
}

export function EmptyFeed({ type, isAuthenticated }: EmptyFeedProps) {
  if (type === "following") {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 px-4")}>
        <div className="w-16 h-16 rounded-full bg-twitter-blue/10 flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-twitter-blue" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">Welcome to X!</h3>
        <p className="text-gray-500 text-center mb-6 max-w-sm">
          Your timeline is empty. Follow some accounts to see their posts here.
        </p>
        <Button className="bg-twitter-blue hover:bg-twitter-blue/90 text-white rounded-full font-bold px-6 py-2">
          Find people to follow
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-16 px-4")}>
        <div className="w-16 h-16 rounded-full bg-twitter-blue/10 flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-twitter-blue" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">Welcome to X!</h3>
        <p className="text-gray-500 text-center mb-6 max-w-sm">
          This is where you&apos;ll see what&apos;s happening in the world right now. Sign in to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4")}>
      <div className="w-16 h-16 rounded-full bg-twitter-blue/10 flex items-center justify-center mb-4">
        <Search className="w-8 h-8 text-twitter-blue" />
      </div>
      <h3 className="text-xl font-bold mb-2 text-white">No posts yet</h3>
      <p className="text-gray-500 text-center mb-6 max-w-sm">
        We couldn&apos;t find any posts for you right now. Try refreshing or check back later.
      </p>
      <Button className="bg-twitter-blue hover:bg-twitter-blue/90 text-white rounded-full font-bold px-6 py-2">
        Refresh feed
      </Button>
    </div>
  );
}
