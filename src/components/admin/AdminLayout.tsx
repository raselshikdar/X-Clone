"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Users,
  FileText,
  Flag,
  Building2,
  BadgeCheck,
  ScrollText,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home, href: "/admin/dashboard" },
  { id: "users", label: "Users", icon: Users, href: "/admin/users" },
  { id: "tweets", label: "Tweets", icon: FileText, href: "/admin/tweets" },
  { id: "reports", label: "Reports", icon: Flag, href: "/admin/reports" },
  { id: "communities", label: "Communities", icon: Building2, href: "/admin/communities" },
  { id: "verification", label: "Verification", icon: BadgeCheck, href: "/admin/verification" },
  { id: "audit-logs", label: "Audit Logs", icon: ScrollText, href: "/admin/audit-logs" },
  { id: "settings", label: "Settings", icon: Settings, href: "/admin/settings" },
];

export function AdminLayout({ children, activeTab }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    pendingReports: 0,
    pendingVerifications: 0,
  });
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Fetch quick stats
    const fetchStats = async () => {
      try {
        const [reportsRes, statsRes] = await Promise.all([
          fetch("/api/admin/reports?status=pending&limit=0"),
          fetch("/api/admin/stats"),
        ]);
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setStats((s) => ({ ...s, pendingReports: data.reports?.length || 0 }));
        }
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats((s) => ({ ...s, pendingReports: data.stats?.pendingReports || 0 }));
        }
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b flex items-center justify-between px-4 z-50">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-blue-500" />
          <span className="font-bold">Admin Dashboard</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white dark:bg-gray-800 border-r z-40 transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20",
          "lg:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Shield className="size-6 text-blue-500" />
            {sidebarOpen && <span className="font-bold">Admin Panel</span>}
          </Link>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:block p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight
              className={cn("size-4 transition-transform", sidebarOpen && "rotate-180")}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showBadge =
              (item.id === "reports" && stats.pendingReports > 0) ||
              (item.id === "verification" && stats.pendingVerifications > 0);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700"
                )}
              >
                <Icon className="size-5 shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {showBadge && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.id === "reports" ? stats.pendingReports : stats.pendingVerifications}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="size-10 rounded-full" />
              ) : (
                <span className="text-sm font-medium">
                  {user?.displayName?.[0] || user?.username?.[0] || "A"}
                </span>
              )}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{user?.displayName || user?.username}</div>
                <div className="text-xs text-gray-500">@{user?.username}</div>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className={cn("w-full", !sidebarOpen && "px-2")}
          >
            <LogOut className="size-4" />
            {sidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={cn(
          "transition-all duration-300 pt-14 lg:pt-0",
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        )}
      >
        <div className="p-6">{children}</div>
      </main>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
