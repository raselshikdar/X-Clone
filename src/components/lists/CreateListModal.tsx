"use client";

import * as React from "react";
import { X, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface CreateListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => Promise<void>;
  editData?: {
    id: string;
    name: string;
    description?: string | null;
    isPrivate: boolean;
  };
}

export function CreateListModal({
  open,
  onOpenChange,
  onSubmit,
  editData,
}: CreateListModalProps) {
  const [name, setName] = React.useState(editData?.name || "");
  const [description, setDescription] = React.useState(
    editData?.description || ""
  );
  const [isPrivate, setIsPrivate] = React.useState(editData?.isPrivate || false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Reset form when modal opens/closes or editData changes
  React.useEffect(() => {
    if (open) {
      setName(editData?.name || "");
      setDescription(editData?.description || "");
      setIsPrivate(editData?.isPrivate || false);
    }
  }, [open, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const nameRemaining = 50 - name.length;
  const descriptionRemaining = 200 - description.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b border-twitter-border dark:border-twitter-border-dark">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 -ml-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
            >
              <X className="size-5" />
            </button>
            <DialogTitle className="text-xl font-bold">
              {editData ? "Edit list" : "Create a new list"}
            </DialogTitle>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || isLoading}
            className="bg-black dark:bg-white text-white dark:text-black rounded-full font-bold px-4 h-9"
          >
            {isLoading ? "Saving..." : editData ? "Save" : "Create"}
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name
            </Label>
            <div className="relative">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="List name"
                maxLength={50}
                className={cn(
                  "pr-14",
                  nameRemaining < 0 && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              <span
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 text-sm",
                  nameRemaining < 0
                    ? "text-red-500"
                    : nameRemaining < 10
                    ? "text-yellow-500"
                    : "text-twitter-secondary dark:text-twitter-secondary-dark"
                )}
              >
                {nameRemaining}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <div className="relative">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this list about?"
                maxLength={200}
                rows={3}
                className={cn(
                  "resize-none pr-14",
                  descriptionRemaining < 0 &&
                    "border-red-500 focus-visible:ring-red-500"
                )}
              />
              <span
                className={cn(
                  "absolute right-3 bottom-3 text-sm",
                  descriptionRemaining < 0
                    ? "text-red-500"
                    : descriptionRemaining < 20
                    ? "text-yellow-500"
                    : "text-twitter-secondary dark:text-twitter-secondary-dark"
                )}
              >
                {descriptionRemaining}
              </span>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-twitter-gray dark:bg-twitter-gray-dark">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <Lock className="size-5 text-twitter-secondary dark:text-twitter-secondary-dark" />
              ) : (
                <Globe className="size-5 text-twitter-secondary dark:text-twitter-secondary-dark" />
              )}
              <div>
                <p className="font-medium">Make private</p>
                <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
                  Only you can see this list
                </p>
              </div>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
              aria-label="Make list private"
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
