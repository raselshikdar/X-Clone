"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  Shield,
  Lock,
  Bell,
  Eye,
  HelpCircle,
  ChevronRight,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
}

const settingsSections: SettingsSection[] = [
  {
    id: "account",
    title: "Your account",
    description: "See information about your account, download an archive of your data, or learn about your account deactivation options",
    icon: User,
    href: "/settings/account",
  },
  {
    id: "verification",
    title: "Verification",
    description: "Apply for verification and manage your verification badge",
    icon: BadgeCheck,
    href: "/settings/verification",
  },
  {
    id: "security",
    title: "Security and account access",
    description: "Manage your account's security and keep track of your account's usage including apps that you have connected to your account",
    icon: Shield,
    href: "/settings/security",
  },
  {
    id: "privacy",
    title: "Privacy and safety",
    description: "Manage what information you see and share on X",
    icon: Lock,
    href: "/settings/privacy",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Select the kinds of notifications you get about your activities and interests",
    icon: Bell,
    href: "/settings/notifications",
  },
  {
    id: "display",
    title: "Accessibility, display, and languages",
    description: "Manage how content is displayed",
    icon: Eye,
    href: "/settings/display",
  },
  {
    id: "resources",
    title: "Additional resources",
    description: "Check out other places for helpful information to learn more about X",
    icon: HelpCircle,
    href: "/settings/resources",
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-full max-w-[320px]">
      <nav className="space-y-0.5">
        {settingsSections.map((section) => {
          const isActive = pathname === section.href ||
            (section.id === "account" && pathname === "/settings");

          return (
            <Link
              key={section.id}
              href={section.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors group",
                isActive
                  ? "bg-twitter-blue/10 text-twitter-blue"
                  : "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
              )}
            >
              <section.icon className="size-5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{section.title}</p>
                <p className="text-xs text-twitter-secondary line-clamp-1 hidden md:block">
                  {section.description}
                </p>
              </div>
              <ChevronRight className="size-4 text-twitter-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
