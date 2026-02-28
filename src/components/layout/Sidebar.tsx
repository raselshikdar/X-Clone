"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  List,
  User,
  MoreHorizontalIcon,
  Feather,
  Users,
  Crown,
  Settings,
  HelpCircle,
  ChevronRight,
  FlaskConical,
  Zap,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/common/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBadge, useUnreadCount } from "@/components/notifications/NotificationBadge";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "next-auth";
import { useTheme } from "next-themes";
import { Moon, Sun, LogOut } from "lucide-react";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
  dynamicBadge?: boolean;
}

// Menu items exactly matching x.com order
const navItems: NavItem[] = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Explore", href: "/explore" },
  { icon: Bell, label: "Notifications", href: "/notifications", dynamicBadge: true },
  { icon: Mail, label: "Messages", href: "/messages" },
  { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
  { icon: List, label: "Lists", href: "/lists" },
  { icon: User, label: "Profile", href: "/profile" },
];

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
}

export function Sidebar({ className, collapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { unreadCount: notificationCount } = useUnreadCount();
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0",
        "w-[68px] xl:w-[275px]",
        "px-2 xl:px-3 py-2",
        "border-r border-twitter-border-dark",
        "bg-black",
        className
      )}
    >
      {/* Logo */}
      <Link
        href="/"
        className={cn(
          "flex items-center justify-center xl:justify-start",
          "w-12 xl:w-auto h-12",
          "rounded-full hover:bg-twitter-hover-dark",
          "transition-colors duration-200"
        )}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="sr-only">X</span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 mt-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4",
                    "h-12 px-3",
                    "rounded-full",
                    "transition-colors duration-200",
                    "hover:bg-twitter-hover-dark",
                    "text-xl",
                    isActive && "font-bold"
                  )}
                >
                  <div className="relative">
                    <Icon className="size-[26px] text-white" strokeWidth={isActive ? 2.5 : 2} />
                    {item.dynamicBadge && item.href === "/notifications" && (
                      <NotificationBadge count={notificationCount} size="sm" className="absolute -top-1 -right-1" />
                    )}
                    {item.badge && !item.dynamicBadge && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-twitter-blue rounded-full">
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    )}
                  </div>
                  <span className={cn(
                    "hidden xl:block text-white",
                    isActive && "font-bold"
                  )}>
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}

          {/* More Menu */}
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex items-center gap-4",
                    "w-full h-12 px-3",
                    "rounded-full",
                    "transition-colors duration-200",
                    "hover:bg-twitter-hover-dark",
                    "text-xl text-white"
                  )}
                >
                  <MoreHorizontalIcon className="size-[26px]" strokeWidth={2} />
                  <span className="hidden xl:block">More</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px] bg-black border-twitter-border-dark text-white">
                <DropdownMenuItem className="focus:bg-twitter-hover-dark gap-3">
                  <Crown className="h-5 w-5" />
                  Premium
                  <span className="ml-auto flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold text-white bg-twitter-blue rounded-full">
                    1
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-twitter-hover-dark gap-3">
                  <Users className="h-5 w-5" />
                  Communities
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-twitter-hover-dark gap-3">
                  <FlaskConical className="h-5 w-5" />
                  Creator Studio
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-twitter-hover-dark gap-3">
                  <Zap className="h-5 w-5" />
                  Business
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-twitter-hover-dark gap-3">
                  <Megaphone className="h-5 w-5" />
                  Ads
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-twitter-border-dark" />
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="focus:bg-twitter-hover-dark gap-3"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-5 w-5" />
                      Light mode
                    </>
                  ) : (
                    <>
                      <Moon className="h-5 w-5" />
                      Dark mode
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-twitter-hover-dark gap-3">
                  <Settings className="h-5 w-5" />
                  Settings and privacy
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-twitter-hover-dark gap-3">
                  <HelpCircle className="h-5 w-5" />
                  Help Center
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>

        {/* Post Button */}
        <div className="mt-4">
          <Button
            className={cn(
              "bg-twitter-blue hover:bg-twitter-blue/90 text-white",
              "rounded-full font-bold",
              "w-12 xl:w-full h-12 xl:h-[52px]",
              "text-[17px]"
            )}
          >
            <Feather className="size-6 xl:hidden" />
            <span className="hidden xl:block">Post</span>
          </Button>
        </div>
      </nav>

      {/* User Profile */}
      {isAuthenticated && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3",
                "w-full p-3 mt-3",
                "rounded-full",
                "hover:bg-twitter-hover-dark",
                "transition-colors duration-200"
              )}
            >
              <UserAvatar
                src={user?.image || null}
                alt={user?.name || "User"}
                fallback={user?.name || user?.username || "U"}
                size="md"
              />
              <div className="hidden xl:block flex-1 text-left">
                <div className="font-bold text-[15px] leading-tight truncate text-white">
                  {user?.name}
                </div>
                <div className="text-gray-500 text-[15px] leading-tight">
                  @{user?.username}
                </div>
              </div>
              <MoreHorizontalIcon className="hidden xl:block size-5 text-gray-500" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-[300px] bg-black border-twitter-border-dark text-white">
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={user?.image || null}
                  alt={user?.name || "User"}
                  fallback={user?.name || user?.username || "U"}
                  size="md"
                />
                <div>
                  <div className="font-bold text-[15px] text-white">{user?.name}</div>
                  <div className="text-gray-500 text-[15px]">@{user?.username}</div>
                </div>
              </div>
              <div className="flex gap-5 mt-3 text-[13px]">
                <span><strong className="text-white">{0}</strong> <span className="text-gray-500">Following</span></span>
                <span><strong className="text-white">{0}</strong> <span className="text-gray-500">Followers</span></span>
              </div>
            </div>
            <DropdownMenuSeparator className="bg-twitter-border-dark" />
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="focus:bg-twitter-hover-dark"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4 mr-3" />
                  Light mode
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-3" />
                  Dark mode
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-twitter-hover-dark">
              Add an existing account
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-twitter-hover-dark">
              <Settings className="h-4 w-4 mr-3" />
              Settings and privacy
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-twitter-border-dark" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="focus:bg-twitter-hover-dark"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Log out @{user?.username}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </aside>
  );
}
