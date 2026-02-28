"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, MoreHorizontal, Moon, Sun, LogOut, Settings, User, HelpCircle, ChevronRight } from "lucide-react";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Sidebar } from "./Sidebar";

export function MobileHeader() {
  const { user, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-[44px] flex items-center justify-between px-4 bg-black border-b border-twitter-border-dark">
      {/* Left - Profile/Menu */}
      {isAuthenticated ? (
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button className="rounded-full hover:bg-twitter-hover-dark p-0.5 transition-colors">
              <UserAvatar
                src={user?.image || null}
                alt={user?.name || "User"}
                fallback={user?.name || user?.username || "U"}
                size="sm"
              />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-black border-r border-twitter-border-dark">
            <Sidebar collapsed={false} className="border-r-0 bg-black" />
          </SheetContent>
        </Sheet>
      ) : (
        <div className="w-8 h-8" />
      )}

      {/* Center - X Logo */}
      <Link href="/" className="flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </Link>

      {/* Right - Subscribe Button or Settings */}
      {isAuthenticated ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full hover:bg-twitter-hover-dark p-2 transition-colors">
              <MoreHorizontal className="h-5 w-5 text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[200px] bg-black border-twitter-border-dark">
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-white focus:bg-twitter-hover-dark"
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
            <DropdownMenuSeparator className="bg-twitter-border-dark" />
            <DropdownMenuItem className="text-white focus:bg-twitter-hover-dark">
              <Settings className="h-4 w-4 mr-3" />
              Settings and privacy
            </DropdownMenuItem>
            <DropdownMenuItem className="text-white focus:bg-twitter-hover-dark">
              <HelpCircle className="h-4 w-4 mr-3" />
              Help Center
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-twitter-border-dark" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-white focus:bg-twitter-hover-dark"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Log out @{user?.username}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="outline"
          className="rounded-full border-white text-white hover:bg-white/10 px-4 py-1.5 h-[32px] text-[15px] font-semibold"
          onClick={() => {
            window.location.href = "/login";
          }}
        >
          Sign in
        </Button>
      )}
    </header>
  );
}
