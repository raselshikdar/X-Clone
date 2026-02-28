"use client";

import * as React from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { PrivacySettings } from "@/components/settings/PrivacySettings";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, UserX, VolumeX } from "lucide-react";
import Link from "next/link";

export default function PrivacyPage() {
  const [settings, setSettings] = React.useState<{
    isPrivate: boolean;
    dmFromAnyone: boolean;
    showReadReceipts: boolean;
    allowTagging: boolean;
    whoCanReply: string;
    locationEnabled: boolean;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/privacy");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching privacy settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SettingsHeader title="Privacy and safety" />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-[280px] border-r border-twitter-border dark:border-twitter-border-dark p-4">
          <SettingsSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl">
          {/* Quick Links */}
          <div className="border-b border-twitter-border dark:border-twitter-border-dark">
            <Link
              href="/settings/blocked"
              className="flex items-center gap-4 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
            >
              <UserX className="size-5 text-twitter-secondary" />
              <div className="flex-1">
                <p className="font-semibold">Blocked accounts</p>
                <p className="text-sm text-twitter-secondary">
                  Manage the accounts you've blocked
                </p>
              </div>
              <ChevronRight className="size-5 text-twitter-secondary" />
            </Link>
            <Link
              href="/settings/muted"
              className="flex items-center gap-4 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
            >
              <VolumeX className="size-5 text-twitter-secondary" />
              <div className="flex-1">
                <p className="font-semibold">Muted accounts</p>
                <p className="text-sm text-twitter-secondary">
                  Manage the accounts you've muted
                </p>
              </div>
              <ChevronRight className="size-5 text-twitter-secondary" />
            </Link>
          </div>

          {/* Privacy Settings */}
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <PrivacySettings settings={settings} />
          )}
        </div>
      </div>
    </div>
  );
}
