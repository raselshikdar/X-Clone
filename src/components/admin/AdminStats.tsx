'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  MessageSquare,
  Flag,
  ShieldAlert,
  UserPlus,
  Activity,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface Stats {
  totalUsers: number;
  totalTweets: number;
  totalCommunities: number;
  pendingReports: number;
  activeSuspensions: number;
  todaySignups: number;
  activeUsersToday: number;
  usersByRole: Record<string, number>;
  tweetsLast7Days: Array<{ date: string; count: number }>;
  reportsByStatus: Record<string, number>;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Failed to load statistics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      description: `${stats.todaySignups} new today`,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Total Tweets',
      value: stats.totalTweets.toLocaleString(),
      description: 'All time',
      icon: MessageSquare,
      color: 'text-green-500',
    },
    {
      title: 'Communities',
      value: stats.totalCommunities.toLocaleString(),
      description: 'Active communities',
      icon: Users,
      color: 'text-purple-500',
    },
    {
      title: 'Pending Reports',
      value: stats.pendingReports.toLocaleString(),
      description: 'Awaiting review',
      icon: Flag,
      color: 'text-orange-500',
    },
    {
      title: 'Active Suspensions',
      value: stats.activeSuspensions.toLocaleString(),
      description: 'Currently suspended',
      icon: ShieldAlert,
      color: 'text-red-500',
    },
    {
      title: 'New Signups',
      value: stats.todaySignups.toLocaleString(),
      description: 'Today',
      icon: UserPlus,
      color: 'text-cyan-500',
    },
    {
      title: 'Active Users',
      value: stats.activeUsersToday.toLocaleString(),
      description: 'Today',
      icon: Activity,
      color: 'text-emerald-500',
    },
    {
      title: 'Total Reports',
      value: Object.values(stats.reportsByStatus).reduce((a, b) => a + b, 0).toLocaleString(),
      description: 'All time',
      icon: AlertCircle,
      color: 'text-amber-500',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Users by Role */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Users by Role</CardTitle>
            <CardDescription>Distribution of user roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.usersByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="capitalize">{role}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{
                          width: `${(count / stats.totalUsers) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {count.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reports by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reports by Status</CardTitle>
            <CardDescription>Report resolution status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.reportsByStatus).map(([status, count]) => {
                const total = Object.values(stats.reportsByStatus).reduce((a, b) => a + b, 0);
                const colors: Record<string, string> = {
                  pending: 'bg-orange-500',
                  reviewed: 'bg-blue-500',
                  resolved: 'bg-green-500',
                  dismissed: 'bg-gray-500',
                };
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[status] || 'bg-primary'}`}
                          style={{
                            width: `${(count / total) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tweets Last 7 Days */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tweets Last 7 Days
            </CardTitle>
            <CardDescription>Daily tweet activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {stats.tweetsLast7Days.map((day, i) => {
                const maxCount = Math.max(...stats.tweetsLast7Days.map((d) => d.count));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full bg-primary/80 hover:bg-primary rounded-t transition-colors"
                        style={{ height: `${height}%` }}
                        title={`${day.count} tweets`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{dayName}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
