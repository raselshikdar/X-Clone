"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface CommunityTabsProps {
  communityId: string;
}

const tabs = [
  { name: "Posts", href: (id: string) => `/communities/${id}` },
  { name: "Members", href: (id: string) => `/communities/${id}/members` },
  { name: "About", href: (id: string) => `/communities/${id}/about` },
];

export function CommunityTabs({ communityId }: CommunityTabsProps) {
  const pathname = usePathname();

  return (
    <div className="border-b border-twitter-border dark:border-twitter-border-dark sticky top-0 bg-white dark:bg-black z-10">
      <nav className="flex">
        {tabs.map((tab) => {
          const href = tab.href(communityId);
          const isActive = pathname === href;

          return (
            <Link
              key={tab.name}
              href={href}
              className={cn(
                "relative flex-1 flex items-center justify-center py-4",
                "text-[15px] font-medium transition-colors",
                "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
                isActive
                  ? "text-black dark:text-white font-bold"
                  : "text-twitter-secondary dark:text-twitter-secondary-dark"
              )}
            >
              {tab.name}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-twitter-blue rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
