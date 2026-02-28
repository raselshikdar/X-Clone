"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { RightSidebar } from "./RightSidebar";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { FloatingActionButton } from "./FloatingActionButton";

interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  showRightSidebar?: boolean;
  centerWidth?: "default" | "wide" | "full";
  onTweetPosted?: () => void;
}

export function MainLayout({
  children,
  className,
  showRightSidebar = true,
  centerWidth = "default",
  onTweetPosted,
}: MainLayoutProps) {
  const centerWidthClass = {
    default: "max-w-[600px]",
    wide: "max-w-[900px]",
    full: "max-w-full",
  }[centerWidth];

  return (
    <div className={cn(
      "flex min-h-screen bg-black",
      "text-white"
    )}>
      {/* Mobile Header */}
      <MobileHeader />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 min-w-0",
          "mt-[44px] lg:mt-0",
          "mb-[50px] lg:mb-0",
          "flex justify-center",
          className
        )}
      >
        <div className={cn(
          "w-full",
          centerWidthClass,
          "border-x border-twitter-border-dark",
          "min-h-screen"
        )}>
          {children}
        </div>
      </main>

      {/* Right Sidebar - Desktop only */}
      {showRightSidebar && (
        <div className="hidden lg:block">
          <RightSidebar />
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Floating Action Button */}
      <FloatingActionButton onTweetPosted={onTweetPosted} />
    </div>
  );
}
