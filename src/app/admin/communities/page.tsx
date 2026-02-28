"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  Trash2,
  Lock,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";

interface Community {
  id: string;
  name: string;
  description: string | null;
  banner: string | null;
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
  owner: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  _count: {
    members: number;
    tweets: number;
  };
}

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const response = await fetch(`/api/admin/communities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCommunities(data.communities);
      }
    } catch (error) {
      console.error("Failed to fetch communities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleDelete = async (community: Community) => {
    if (!confirm(`Are you sure you want to delete the community "${community.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/communities/${community.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({ title: "Community deleted", description: `${community.name} has been deleted.` });
        fetchCommunities();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete community",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout activeTab="communities">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Communities</h1>
            <p className="text-gray-500">Manage platform communities</p>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md">
          <Input
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCommunities()}
          />
        </div>

        {/* Communities Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden animate-pulse">
                <div className="h-24 bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))
          ) : communities.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
              <Building2 className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No communities found</h3>
              <p className="text-gray-500">No communities match your search.</p>
            </div>
          ) : (
            communities.map((community) => (
              <div
                key={community.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border"
              >
                {/* Banner */}
                <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500 relative">
                  {community.banner ? (
                    <img
                      src={community.banner}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute top-2 right-2">
                    <Badge variant={community.isPrivate ? "secondary" : "outline"} className="bg-black/50 text-white border-0">
                      {community.isPrivate ? <Lock className="size-3 mr-1" /> : <Globe className="size-3 mr-1" />}
                      {community.isPrivate ? "Private" : "Public"}
                    </Badge>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link
                        href={`/communities/${community.id}`}
                        className="font-semibold text-lg hover:underline"
                      >
                        c/{community.name}
                      </Link>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {community.description || "No description"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/communities/${community.id}`}>
                            <Eye className="size-4 mr-2" />
                            View Community
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(community)}
                          className="text-red-600"
                        >
                          <Trash2 className="size-4 mr-2" />
                          Delete Community
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="size-4" />
                      {community._count.members} members
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      {new Date(community.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t text-sm">
                    <span className="text-gray-500">Owner:</span>{" "}
                    <Link
                      href={`/${community.owner.username}`}
                      className="text-blue-500 hover:underline"
                    >
                      @{community.owner.username}
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
