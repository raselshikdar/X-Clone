"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TweetComposer } from "./TweetComposer";

interface TweetComposerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  replyToId?: string;
  quoteToId?: string;
}

export function TweetComposerModal({
  open,
  onOpenChange,
  replyToId,
  quoteToId,
}: TweetComposerModalProps) {
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-white dark:bg-black">
        <DialogHeader className="sr-only">
          <DialogTitle>Compose Tweet</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-twitter-border dark:border-twitter-border-dark">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="rounded-full size-9"
          >
            <X className="size-5" />
          </Button>

          <Button
            variant="ghost"
            className="text-twitter-blue font-semibold"
          >
            Drafts
          </Button>
        </div>

        {/* Composer */}
        <TweetComposer
          replyToId={replyToId}
          quoteToId={quoteToId}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
