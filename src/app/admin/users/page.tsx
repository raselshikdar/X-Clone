"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  MoreHorizontal,
  Shield,
  Ban,
  AlertTriangle,
  CheckCircle,
  UserCog,
  Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  verified: boolean;
  role: string;
  isPrivate: boolean;
  createdAt: string;
  _count: {
    tweets: number;
    followers: number;
    following: number;
  };
  suspensions: { id: string }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState(7);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleSuspend = async () => {
    if (!suspendModal.user) return;

    setSuspendLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${suspendModal.user.id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason, durationDays: suspendDuration }),
      });

      if (response.ok) {
        toast({ title: "User suspended", description: `@${suspendModal.user.username} has been suspended.` });
        fetchUsers();
        setSuspendModal({ open: false, user: null });
        setSuspendReason("");
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to suspend user",
        variant: "destructive",
      });
    } finally {
      setSuspendLoading(false);
    }
  };

  const handleBan = async (user: User) => {
    if (!confirm(`Are you sure you want to permanently ban @${user.username}? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Permanently banned by admin" }),
      });

      if (response.ok) {
        toast({ title: "User banned", description: `@${user.username} has been permanently banned.` });
        fetchUsers();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to ban user",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (user: User, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast({ title: "Role updated", description: `@${user.username} is now a ${newRole}.` });
        fetchUsers();
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
  };

  return (
    <AdminLayout activeTab="users">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users</h1>
            <p className="text-gray-500">Manage platform users</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
          <div className="flex gap-2">
            <Button
              variant={roleFilter === null ? "default" : "outline"}
              onClick={() => setRoleFilter(null)}
            >
              All
            </Button>
            <Button
              variant={roleFilter === "user" ? "default" : "outline"}
              onClick={() => setRoleFilter("user")}
            >
              Users
            </Button>
            <Button
              variant={roleFilter === "moderator" ? "default" : "outline"}
              onClick={() => setRoleFilter("moderator")}
            >
              Moderators
            </Button>
            <Button
              variant={roleFilter === "admin" ? "default" : "outline"}
              onClick={() => setRoleFilter("admin")}
            >
              Admins
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Stats</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-10 bg-gray-200 rounded-full" />
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                            <div className="h-3 bg-gray-200 rounded w-16" />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-8 bg-gray-200 rounded w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <Link href={`/admin/users/${user.id}`} className="flex items-center gap-3">
                          <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="size-10 object-cover" />
                            ) : (
                              <span>{(user.displayName || user.username)[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {user.displayName || user.username}
                              {user.verified && <CheckCircle className="size-4 text-blue-500" />}
                            </div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={user.role === "admin" ? "default" : user.role === "moderator" ? "secondary" : "outline"}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {user._count.tweets} posts · {user._count.followers} followers
                      </td>
                      <td className="px-4 py-3">
                        {user.suspensions.length > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="size-3" />
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`}>
                                <Eye className="size-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.role !== "admin" && (
                              <>
                                <DropdownMenuItem onClick={() => setSuspendModal({ open: true, user })}>
                                  <AlertTriangle className="size-4 mr-2" />
                                  Suspend
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleBan(user)} className="text-red-600">
                                  <Ban className="size-4 mr-2" />
                                  Ban Permanently
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleRoleChange(user, "moderator")}>
                                  <Shield className="size-4 mr-2" />
                                  Make Moderator
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(user, "admin")}>
                                  <UserCog className="size-4 mr-2" />
                                  Make Admin
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Suspend Modal */}
      <Dialog open={suspendModal.open} onOpenChange={(open) => setSuspendModal({ open, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend @{suspendModal.user?.username} from the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Duration (days)</Label>
              <Input
                type="number"
                value={suspendDuration}
                onChange={(e) => setSuspendDuration(parseInt(e.target.value) || 7)}
                min={1}
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Enter reason for suspension..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSuspendModal({ open: false, user: null })}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleSuspend}
                disabled={!suspendReason.trim() || suspendLoading}
              >
                {suspendLoading ? "Suspending..." : "Suspend User"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
