"use client";

import * as React from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { BlockedAccounts } from "@/components/settings/BlockedAccounts";

export default function BlockedPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SettingsHeader title="Blocked accounts" backHref="/settings/privacy" />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-[280px] border-r border-twitter-border dark:border-twitter-border-dark p-4">
          <SettingsSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl">
          <BlockedAccounts />
        </div>
      </div>
    </div>
  );
}
