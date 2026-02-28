"use client";

import * as React from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { SessionsList } from "@/components/settings/SessionsList";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Smartphone, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function SecurityPage() {
  const [sessionsData, setSessionsData] = React.useState<{
    currentSession?: {
      device: string;
      browser: string;
      os: string;
      ipAddress: string;
    };
    sessions?: Array<{
      id: string;
      device: string;
      browser: string;
      os: string;
      location: string;
      lastActive: string;
      createdAt: string;
      isCurrent: boolean;
    }>;
  }>({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch("/api/settings/sessions");
        if (response.ok) {
          const data = await response.json();
          setSessionsData(data);
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SettingsHeader title="Security and account access" />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-[280px] border-r border-twitter-border dark:border-twitter-border-dark p-4">
          <SettingsSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl">
          {/* Security Options */}
          <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
            {/* Password */}
            <Link
              href="/settings/account"
              className="flex items-center gap-4 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
            >
              <Key className="size-5 text-twitter-secondary" />
              <div className="flex-1">
                <p className="font-semibold">Change your password</p>
                <p className="text-sm text-twitter-secondary">
                  Manage your account password
                </p>
              </div>
              <ChevronRight className="size-5 text-twitter-secondary" />
            </Link>

            {/* Two-Factor Auth */}
            <div className="flex items-center gap-4 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors cursor-pointer">
              <Shield className="size-5 text-twitter-secondary" />
              <div className="flex-1">
                <p className="font-semibold">Two-factor authentication</p>
                <p className="text-sm text-twitter-secondary">
                  Add an extra layer of security to your account
                </p>
              </div>
              <ChevronRight className="size-5 text-twitter-secondary" />
            </div>

            {/* Security checkup */}
            <div className="flex items-center gap-4 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors cursor-pointer">
              <Smartphone className="size-5 text-twitter-secondary" />
              <div className="flex-1">
                <p className="font-semibold">Security checkup</p>
                <p className="text-sm text-twitter-secondary">
                  Review your account security
                </p>
              </div>
              <ChevronRight className="size-5 text-twitter-secondary" />
            </div>
          </div>

          {/* Sessions */}
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <SessionsList
              currentSession={sessionsData.currentSession}
              sessions={sessionsData.sessions}
            />
          )}
        </div>
      </div>
    </div>
  );
}
