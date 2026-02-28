"use client";

import * as React from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { MutedAccounts } from "@/components/settings/MutedAccounts";

export default function MutedPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SettingsHeader title="Muted accounts" backHref="/settings/privacy" />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-[280px] border-r border-twitter-border dark:border-twitter-border-dark p-4">
          <SettingsSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl">
          <MutedAccounts />
        </div>
      </div>
    </div>
  );
}
