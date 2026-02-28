"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface PrivacySettingsProps {
  settings: {
    isPrivate: boolean;
    dmFromAnyone: boolean;
    showReadReceipts: boolean;
    allowTagging: boolean;
    whoCanReply: string;
    locationEnabled: boolean;
  } | null;
}

export function PrivacySettings({ settings }: PrivacySettingsProps) {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = React.useState({
    isPrivate: settings?.isPrivate ?? false,
    dmFromAnyone: settings?.dmFromAnyone ?? true,
    showReadReceipts: settings?.showReadReceipts ?? true,
    allowTagging: settings?.allowTagging ?? true,
    whoCanReply: settings?.whoCanReply ?? "everyone",
    locationEnabled: settings?.locationEnabled ?? false,
  });

  const updateSetting = async (key: string, value: boolean | string) => {
    // Optimistic update
    setLocalSettings((prev) => ({ ...prev, [key]: value }));

    try {
      const response = await fetch("/api/settings/privacy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        // Revert on error
        setLocalSettings((prev) => ({ ...prev, [key]: settings?.[key as keyof typeof settings] }));
        throw new Error("Failed to update");
      }

      toast({
        title: "Settings updated",
        description: "Your privacy settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
      {/* Private Account */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Protect your posts</h2>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold">Protect your posts</p>
            <p className="text-sm text-twitter-secondary mt-1">
              When selected, your posts and other account information are only visible to people who follow you. Anyone who wants to follow you will have to request to follow you, which you can approve or decline.
            </p>
          </div>
          <Switch
            checked={localSettings.isPrivate}
            onCheckedChange={(checked) => updateSetting("isPrivate", checked)}
          />
        </div>
      </div>

      {/* Photo Tagging */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Photo tagging</h2>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold">Allow people to tag you in photos</p>
              <p className="text-sm text-twitter-secondary mt-1">
                When enabled, others can tag you in photos they upload. You can review tags before they appear on your profile.
              </p>
            </div>
            <Switch
              checked={localSettings.allowTagging}
              onCheckedChange={(checked) => updateSetting("allowTagging", checked)}
            />
          </div>
        </div>
      </div>

      {/* Direct Messages */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Direct Messages</h2>
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold">Allow message requests from everyone</p>
              <p className="text-sm text-twitter-secondary mt-1">
                When enabled, you can receive message requests from anyone on X. You can accept or delete these requests.
              </p>
            </div>
            <Switch
              checked={localSettings.dmFromAnyone}
              onCheckedChange={(checked) => updateSetting("dmFromAnyone", checked)}
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="font-semibold">Show read receipts</p>
              <p className="text-sm text-twitter-secondary mt-1">
                When enabled, others can see when you've read their messages. You'll also see when they've read your messages.
              </p>
            </div>
            <Switch
              checked={localSettings.showReadReceipts}
              onCheckedChange={(checked) => updateSetting("showReadReceipts", checked)}
            />
          </div>
        </div>
      </div>

      {/* Who Can Reply */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Post audience and replies</h2>
        <div className="space-y-4">
          <p className="text-sm text-twitter-secondary">
            Choose who can reply to your posts. This can be changed for each individual post when composing.
          </p>
          <RadioGroup
            value={localSettings.whoCanReply}
            onValueChange={(value) => updateSetting("whoCanReply", value)}
            className="space-y-3"
          >
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark">
              <RadioGroupItem value="everyone" id="everyone" />
              <Label htmlFor="everyone" className="cursor-pointer flex-1">
                <p className="font-semibold">Everyone</p>
                <p className="text-sm text-twitter-secondary">Anyone can reply</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark">
              <RadioGroupItem value="following" id="following" />
              <Label htmlFor="following" className="cursor-pointer flex-1">
                <p className="font-semibold">People you follow</p>
                <p className="text-sm text-twitter-secondary">Only people you follow can reply</p>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark">
              <RadioGroupItem value="mentioned" id="mentioned" />
              <Label htmlFor="mentioned" className="cursor-pointer flex-1">
                <p className="font-semibold">Only people you mention</p>
                <p className="text-sm text-twitter-secondary">Only people you mention in your post can reply</p>
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Location */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Location information</h2>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold">Add location information to posts</p>
            <p className="text-sm text-twitter-secondary mt-1">
              When enabled, you can add location information to your posts. Your location won't be added automatically.
            </p>
          </div>
          <Switch
            checked={localSettings.locationEnabled}
            onCheckedChange={(checked) => updateSetting("locationEnabled", checked)}
          />
        </div>
      </div>
    </div>
  );
}
