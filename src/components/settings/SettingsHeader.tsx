"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SettingsHeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  actions?: React.ReactNode;
}

export function SettingsHeader({
  title,
  showBack = true,
  backHref,
  actions,
}: SettingsHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark">
      <div className="flex items-center gap-6 px-4 h-[53px]">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
        {actions && <div className="ml-auto">{actions}</div>}
      </div>
    </header>
  );
}
