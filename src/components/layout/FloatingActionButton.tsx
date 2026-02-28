"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TweetComposer } from "@/components/tweet/TweetComposer";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onTweetPosted?: () => void;
}

export function FloatingActionButton({ onTweetPosted }: FloatingActionButtonProps) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const handleTweetPosted = () => {
    setIsOpen(false);
    onTweetPosted?.();
  };

  return (
    <>
      {/* Mobile FAB - exact X.com style with plus icon */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "lg:hidden fixed z-40",
          "bottom-[66px] right-4",
          "w-[56px] h-[56px]",
          "bg-twitter-blue hover:bg-[#1a8cd8]",
          "rounded-full",
          "flex items-center justify-center",
          "shadow-lg shadow-twitter-blue/30",
          "transition-all duration-150",
          "hover:scale-105 active:scale-95"
        )}
        aria-label="Compose post"
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </button>

      {/* Desktop floating post button - shown in sidebar */}

      {/* Tweet composer dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="bg-black border-twitter-border-dark text-white max-w-lg w-full p-0 rounded-2xl"
          showCloseButton={false}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Compose new post</DialogTitle>
          </DialogHeader>
          <TweetComposer
            onTweetPosted={handleTweetPosted}
            compact={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
