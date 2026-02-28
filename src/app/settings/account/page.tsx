"use client";

import * as React from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountSettingsPage() {
  const [user, setUser] = React.useState<{
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    phone: string | null;
    createdAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/settings/account");
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SettingsHeader title="Your account" backHref="/" />
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
            </div>
          ) : (
            <AccountSettings user={user} />
          )}
        </div>
      </div>
    </div>
  );
}
