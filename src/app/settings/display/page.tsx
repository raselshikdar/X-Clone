"use client";

import * as React from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function DisplayPage() {
  const [settings, setSettings] = React.useState<{
    darkMode: boolean;
    theme: string;
    fontSize: string;
    displayLanguage: string;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings/appearance");
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error("Error fetching appearance settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SettingsHeader title="Accessibility, display, and languages" />
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
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <AppearanceSettings settings={settings} />
          )}
        </div>
      </div>
    </div>
  );
}
