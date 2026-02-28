"use client";

import * as React from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationsPage() {
  const [settings, setSettings] = React.useState<{
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    notifyLikes: boolean;
    notifyRetweets: boolean;
    notifyFollows: boolean;
    notifyMentions: boolean;
    notifyReplies: boolean;
    notifyDMs: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/notifications");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching notification settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SettingsHeader title="Notifications" />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-[280px] border-r border-twitter-border dark:border-twitter-border-dark p-4">
          <SettingsSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <NotificationSettings settings={settings} />
          )}
        </div>
      </div>
    </div>
  );
}
