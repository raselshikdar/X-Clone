'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  MoreHorizontal,
  Shield,
  ShieldAlert,
  UserX,
  CheckCircle,
  ExternalLink,
  Ban,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRole, getRoleBadgeColor } from '@/lib/admin';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  avatar: string | null;
  role: string;
  verified: boolean;
  isPrivate: boolean;
  createdAt: string;
  isSuspended: boolean;
  _count: {
    tweets: number;
    followers: number;
    following: number;
    likes: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function UsersTable() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (search) params.set('search', search);
      if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchUsers();
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </form>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16 mt-1" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>
                          {user.displayName?.[0] || user.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.displayName || user.username}</span>
                          {user.verified && (
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">@{user.username}</span>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {formatRole(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span>{user._count.tweets} tweets</span>
                      <span className="mx-2">·</span>
                      <span>{user._count.followers} followers</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    {user.isSuspended ? (
                      <Badge variant="destructive">Suspended</Badge>
                    ) : user.isPrivate ? (
                      <Badge variant="secondary">Private</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${user.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/${user.username}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.role !== 'admin' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleRoleUpdate(user.id, 'moderator')}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Moderator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleUpdate(user.id, 'admin')}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {user.role === 'moderator' && (
                          <DropdownMenuItem
                            onClick={() => handleRoleUpdate(user.id, 'user')}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Remove Role
                          </DropdownMenuItem>
                        )}
                        {!user.isSuspended && user.role !== 'admin' && (
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/users/${user.id}?action=suspend`}>
                              <Clock className="mr-2 h-4 w-4" />
                              Suspend
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {!user.isSuspended && user.role !== 'admin' && (
                          <DropdownMenuItem asChild className="text-destructive">
                            <Link href={`/admin/users/${user.id}?action=ban`}>
                              <Ban className="mr-2 h-4 w-4" />
                              Ban User
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {user.isSuspended && (
                          <DropdownMenuItem
                            onClick={async () => {
                              await fetch(`/api/admin/users/${user.id}/suspend`, {
                                method: 'DELETE',
                              });
                              fetchUsers();
                            }}
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Lift Suspension
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
