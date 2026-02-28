"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { NotificationBadge, useUnreadCount } from "@/components/notifications/NotificationBadge";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: boolean;
}

// x.com has exactly 4 bottom nav items: Home, Search, Notifications, Messages
const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: Bell, label: "Notifications", href: "/notifications", badge: true },
  { icon: Mail, label: "Messages", href: "/messages" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { unreadCount: notificationCount } = useUnreadCount();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-[50px] flex items-center justify-around bg-black border-t border-twitter-border-dark safe-area-pb">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-center",
              "flex-1 h-full",
              "relative",
              "transition-colors duration-200"
            )}
          >
            <div className="relative">
              <Icon
                className={cn(
                  "h-6 w-6",
                  isActive ? "text-white" : "text-gray-500"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.badge && notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-twitter-blue rounded-full">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
