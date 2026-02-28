"use client";

import * as React from "react";
import { Bell, Mail, Heart, Repeat, UserPlus, AtSign, MessageCircle, MessageSquare } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface NotificationSettingsProps {
  settings: {
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    notifyLikes: boolean;
    notifyRetweets: boolean;
    notifyFollows: boolean;
    notifyMentions: boolean;
    notifyReplies: boolean;
    notifyDMs: boolean;
  } | null;
}

export function NotificationSettings({ settings }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [localSettings, setLocalSettings] = React.useState({
    notificationsEnabled: settings?.notificationsEnabled ?? true,
    emailNotifications: settings?.emailNotifications ?? true,
    pushNotifications: settings?.pushNotifications ?? true,
    notifyLikes: settings?.notifyLikes ?? true,
    notifyRetweets: settings?.notifyRetweets ?? true,
    notifyFollows: settings?.notifyFollows ?? true,
    notifyMentions: settings?.notifyMentions ?? true,
    notifyReplies: settings?.notifyReplies ?? true,
    notifyDMs: settings?.notifyDMs ?? true,
  });

  const updateSetting = async (key: string, value: boolean) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));

    try {
      const response = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) {
        setLocalSettings((prev) => ({ ...prev, [key]: settings?.[key as keyof typeof settings] ?? true }));
        throw new Error("Failed to update");
      }

      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const notificationTypes = [
    {
      id: "notifyLikes",
      icon: Heart,
      label: "Likes",
      description: "Get notified when someone likes your post",
    },
    {
      id: "notifyRetweets",
      icon: Repeat,
      label: "Reposts",
      description: "Get notified when someone reposts your post",
    },
    {
      id: "notifyFollows",
      icon: UserPlus,
      label: "New followers",
      description: "Get notified when someone follows you",
    },
    {
      id: "notifyMentions",
      icon: AtSign,
      label: "Mentions",
      description: "Get notified when someone mentions you",
    },
    {
      id: "notifyReplies",
      icon: MessageCircle,
      label: "Replies",
      description: "Get notified when someone replies to your post",
    },
    {
      id: "notifyDMs",
      icon: MessageSquare,
      label: "Direct messages",
      description: "Get notified when you receive a direct message",
    },
  ];

  return (
    <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
      {/* Push Notifications */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Push notifications</h2>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="size-5 text-twitter-secondary" />
            <div className="flex-1">
              <p className="font-semibold">Push notifications</p>
              <p className="text-sm text-twitter-secondary">
                Get push notifications on your device
              </p>
            </div>
          </div>
          <Switch
            checked={localSettings.pushNotifications}
            onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
          />
        </div>
      </div>

      {/* Email Notifications */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Email notifications</h2>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Mail className="size-5 text-twitter-secondary" />
            <div className="flex-1">
              <p className="font-semibold">Email notifications</p>
              <p className="text-sm text-twitter-secondary">
                Get notifications via email
              </p>
            </div>
          </div>
          <Switch
            checked={localSettings.emailNotifications}
            onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
          />
        </div>
      </div>

      {/* Notifications by Type */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Notifications</h2>
        <p className="text-sm text-twitter-secondary mb-4">
          Choose what activities you want to be notified about.
        </p>
        <div className="space-y-0 divide-y divide-twitter-border dark:divide-twitter-border-dark">
          {notificationTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <type.icon className="size-5 text-twitter-secondary" />
                <div>
                  <p className="font-semibold">{type.label}</p>
                  <p className="text-sm text-twitter-secondary">{type.description}</p>
                </div>
              </div>
              <Switch
                checked={localSettings[type.id as keyof typeof localSettings] as boolean}
                onCheckedChange={(checked) => updateSetting(type.id, checked)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Master Toggle */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-4 p-4 bg-twitter-gray/20 dark:bg-twitter-gray-dark/20 rounded-lg">
          <div className="flex-1">
            <p className="font-semibold">Pause all notifications</p>
            <p className="text-sm text-twitter-secondary mt-1">
              When enabled, you won't receive any push notifications. Email notifications will still be sent for important security alerts.
            </p>
          </div>
          <Switch
            checked={!localSettings.notificationsEnabled}
            onCheckedChange={(checked) => updateSetting("notificationsEnabled", !checked)}
          />
        </div>
      </div>
    </div>
  );
}
