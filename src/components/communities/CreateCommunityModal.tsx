"use client";

import { useState } from "react";
import { X, Lock, Globe, Image as ImageIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CreateCommunityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCommunityData) => Promise<void>;
}

export interface CreateCommunityData {
  name: string;
  description?: string;
  banner?: string;
  icon?: string;
  isPrivate: boolean;
  rules?: string[];
}

export function CreateCommunityModal({
  open,
  onOpenChange,
  onSubmit,
}: CreateCommunityModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameCharLimit = 50;
  const descriptionCharLimit = 200;

  const handleAddRule = () => {
    if (newRule.trim() && rules.length < 10) {
      setRules([...rules, newRule.trim()]);
      setNewRule("");
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Community name is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
        rules: rules.length > 0 ? rules : undefined,
      });

      // Reset form
      setName("");
      setDescription("");
      setIsPrivate(false);
      setRules([]);
      setNewRule("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create community");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName("");
      setDescription("");
      setIsPrivate(false);
      setRules([]);
      setNewRule("");
      setError(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Community</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <div className="relative">
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Community name"
                maxLength={nameCharLimit}
                className="pr-16"
              />
              <span
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 text-[13px]",
                  name.length > nameCharLimit * 0.9
                    ? "text-red-500"
                    : "text-twitter-secondary dark:text-twitter-secondary-dark"
                )}
              >
                {name.length}/{nameCharLimit}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this community about?"
                maxLength={descriptionCharLimit}
                rows={3}
                className="resize-none pr-16"
              />
              <span
                className={cn(
                  "absolute right-3 bottom-3 text-[13px]",
                  description.length > descriptionCharLimit * 0.9
                    ? "text-red-500"
                    : "text-twitter-secondary dark:text-twitter-secondary-dark"
                )}
              >
                {description.length}/{descriptionCharLimit}
              </span>
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-twitter-hover dark:bg-twitter-hover-dark">
            <div className="flex items-center gap-3">
              {isPrivate ? (
                <Lock className="size-5 text-twitter-secondary" />
              ) : (
                <Globe className="size-5 text-twitter-secondary" />
              )}
              <div>
                <div className="font-medium text-[15px]">
                  {isPrivate ? "Private community" : "Public community"}
                </div>
                <div className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
                  {isPrivate
                    ? "Only members can see posts"
                    : "Anyone can see and join"}
                </div>
              </div>
            </div>
            <Switch
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          {/* Rules */}
          <div className="space-y-2">
            <Label>Rules (optional)</Label>
            <div className="space-y-2">
              {rules.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-lg bg-twitter-hover dark:bg-twitter-hover-dark"
                >
                  <span className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
                    {index + 1}.
                  </span>
                  <span className="flex-1 text-[14px] truncate">{rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(index)}
                    className="p-1 rounded-full hover:bg-twitter-blue/10 hover:text-twitter-blue"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              {rules.length < 10 && (
                <div className="flex items-center gap-2">
                  <Input
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Add a rule..."
                    maxLength={200}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddRule();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleAddRule}
                    disabled={!newRule.trim()}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-twitter-border dark:border-twitter-border-dark">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!name.trim() || isSubmitting}
              className="bg-twitter-blue hover:bg-twitter-blue/90"
            >
              {isSubmitting ? (
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Create Community"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
