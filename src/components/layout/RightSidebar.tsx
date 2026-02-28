"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhoToFollow } from "@/components/suggestions";
import { TrendingSidebar } from "@/components/trending";

const footerLinks = [
  { label: "Terms of Service", href: "#" },
  { label: "Privacy Policy", href: "#" },
  { label: "Cookie Policy", href: "#" },
  { label: "Accessibility", href: "#" },
  { label: "Ads info", href: "#" },
  { label: "More", href: "#" },
];

interface RightSidebarProps {
  className?: string;
}

export function RightSidebar({ className }: RightSidebarProps) {
  const router = useRouter();

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <aside
      className={cn(
        "hidden lg:block",
        "w-[350px] xl:w-[400px]",
        "px-6 py-2",
        "h-screen sticky top-0",
        "overflow-y-auto scrollbar-hide",
        className
      )}
    >
      {/* Search Bar */}
      <div className="sticky top-0 py-2 bg-black z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-gray-500" />
          <Input
            type="search"
            placeholder="Search"
            className={cn(
              "h-[42px] pl-12 pr-4",
              "bg-[#202327]",
              "border-none rounded-full",
              "text-[15px] text-white",
              "placeholder:text-gray-500",
              "focus-visible:ring-twitter-blue focus-visible:ring-1",
              "focus-visible:bg-black"
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch((e.target as HTMLInputElement).value);
              }
            }}
          />
        </div>
      </div>

      {/* Subscribe to Premium */}
      <div className="mt-4 rounded-2xl bg-[#16181c] overflow-hidden">
        <h2 className="font-bold text-xl px-4 pt-4 text-white">Subscribe to Premium</h2>
        <p className="text-[15px] px-4 py-2 text-gray-400">
          Subscribe to unlock new features and if eligible, receive a share of ads revenue.
        </p>
        <div className="px-4 pb-4">
          <Button className="bg-twitter-blue hover:bg-twitter-blue/90 text-white rounded-full font-bold px-4 h-9">
            Subscribe
          </Button>
        </div>
      </div>

      {/* What's happening - Dynamic Trending */}
      <TrendingSidebar className="mt-4" />

      {/* Who to follow - Dynamic */}
      <WhoToFollow className="mt-4" limit={3} />

      {/* Footer Links */}
      <nav className="mt-4 px-4">
        <ul className="flex flex-wrap gap-x-2 gap-y-1">
          {footerLinks.map((link, index) => (
            <li key={index}>
              <Link
                href={link.href}
                className="text-[13px] text-gray-500 hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-[13px] text-gray-500 mt-2">
          © 2026 X Corp.
        </p>
      </nav>
    </aside>
  );
}
