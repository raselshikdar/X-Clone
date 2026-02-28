"use client";

import { useEffect, useState } from "react";
import {
  Users,
  FileText,
  Building2,
  Flag,
  BadgeCheck,
  TrendingUp,
  UserPlus,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { cn } from "@/lib/utils";

interface Stats {
  totalUsers: number;
  totalTweets: number;
  totalCommunities: number;
  totalReports: number;
  pendingReports: number;
  newUsersToday: number;
  tweetsToday: number;
  activeUsersToday: number;
  verifiedUsers: number;
  suspendedUsers: number;
}

interface ChartData {
  date: string;
  count: number;
}

interface ReportTypeData {
  type: string;
  count: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [userGrowth, setUserGrowth] = useState<ChartData[]>([]);
  const [reportsByType, setReportsByType] = useState<ReportTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setUserGrowth(data.charts?.userGrowth || []);
          setReportsByType(data.charts?.reportsByType || []);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
        { label: "Total Tweets", value: stats.totalTweets, icon: FileText, color: "text-green-500" },
        { label: "Communities", value: stats.totalCommunities, icon: Building2, color: "text-purple-500" },
        { label: "Pending Reports", value: stats.pendingReports, icon: Flag, color: "text-red-500" },
        { label: "New Users Today", value: stats.newUsersToday, icon: UserPlus, color: "text-cyan-500" },
        { label: "Tweets Today", value: stats.tweetsToday, icon: TrendingUp, color: "text-orange-500" },
        { label: "Verified Users", value: stats.verifiedUsers, icon: BadgeCheck, color: "text-blue-400" },
        { label: "Suspended Users", value: stats.suspendedUsers, icon: AlertTriangle, color: "text-yellow-500" },
      ]
    : [];

  return (
    <AdminLayout activeTab="dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Platform overview and statistics</p>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-8 bg-gray-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                      </div>
                      <div className={cn("p-3 rounded-full bg-gray-100 dark:bg-gray-800", stat.color)}>
                        <Icon className="size-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                User Growth (Last 7 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userGrowth.length > 0 ? (
                <div className="h-48 flex items-end gap-2">
                  {userGrowth.map((d, i) => {
                    const maxCount = Math.max(...userGrowth.map((x) => x.count), 1);
                    const height = (d.count / maxCount) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <span className="text-xs text-gray-500">{d.date.slice(5)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reports by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="size-5" />
                Pending Reports by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportsByType.length > 0 ? (
                <div className="space-y-3">
                  {reportsByType.map((r, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-20 capitalize text-sm">{r.type}</span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                        <div
                          className="bg-red-500 h-4 rounded-full transition-all"
                          style={{
                            width: `${Math.min((r.count / Math.max(...reportsByType.map((x) => x.count), 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{r.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  No pending reports
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Feed Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              Activity feed will show recent admin actions, new reports, and user registrations.
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
