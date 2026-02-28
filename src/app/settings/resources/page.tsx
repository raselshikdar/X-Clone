"use client";

import * as React from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { ChevronRight, HelpCircle, FileText, Shield, Users, ExternalLink } from "lucide-react";
import Link from "next/link";

const resources = [
  {
    id: "help",
    icon: HelpCircle,
    title: "Help Center",
    description: "Find answers to common questions and get help with your account",
    href: "https://help.x.com",
    external: true,
  },
  {
    id: "terms",
    icon: FileText,
    title: "Terms of Service",
    description: "Read our terms of service and usage policies",
    href: "https://x.com/tos",
    external: true,
  },
  {
    id: "privacy",
    icon: Shield,
    title: "Privacy Policy",
    description: "Learn how we collect and use your information",
    href: "https://x.com/privacy",
    external: true,
  },
  {
    id: "community",
    icon: Users,
    title: "Community Guidelines",
    description: "Understand the rules and norms of our community",
    href: "https://help.x.com/rules",
    external: true,
  },
];

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <SettingsHeader title="Additional resources" />
      <div className="flex">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden md:block w-[280px] border-r border-twitter-border dark:border-twitter-border-dark p-4">
          <SettingsSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-2xl">
          <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
            {resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
              >
                <resource.icon className="size-5 text-twitter-secondary" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{resource.title}</p>
                    {resource.external && (
                      <ExternalLink className="size-3 text-twitter-secondary" />
                    )}
                  </div>
                  <p className="text-sm text-twitter-secondary">
                    {resource.description}
                  </p>
                </div>
                <ChevronRight className="size-5 text-twitter-secondary" />
              </a>
            ))}
          </div>

          {/* Contact */}
          <div className="p-4 mt-4">
            <div className="p-4 bg-twitter-gray/10 dark:bg-twitter-gray-dark/10 rounded-lg">
              <p className="font-semibold mb-2">Need more help?</p>
              <p className="text-sm text-twitter-secondary mb-4">
                If you can't find what you're looking for, our support team is here to help.
              </p>
              <a
                href="https://help.x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-twitter-blue hover:underline"
              >
                Contact support
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
