"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Users, Plus, Search, Lock, Globe, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
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

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const fetchCommunities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const response = await fetch(`/api/communities?${params}`);
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

  const handleCreate = async () => {
    if (!newCommunity.name.trim()) return;

    setCreateLoading(true);
    try {
      const response = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCommunity),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create community");
      }

      toast({ title: "Community created!", description: `c/${newCommunity.name} is now live.` });
      setCreateModal(false);
      setNewCommunity({ name: "", description: "", isPrivate: false });
      router.push(`/communities/${data.community.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create community",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b px-4 py-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Communities</h1>
          {isAuthenticated && (
            <Button onClick={() => setCreateModal(true)} className="gap-2">
              <Plus className="size-4" />
              Create Community
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchCommunities()}
            className="pl-10"
          />
        </div>
      </div>

      {/* Communities Grid */}
      <div className="p-4">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-gray-800" />
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="size-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-1">No communities found</h3>
            <p className="text-gray-500 mb-4">Be the first to create a community!</p>
            {isAuthenticated && (
              <Button onClick={() => setCreateModal(true)}>Create Community</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {communities.map((community) => (
              <Link key={community.id} href={`/communities/${community.id}`}>
                <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Banner */}
                  <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-500 relative">
                    {community.banner && (
                      <img src={community.banner} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant={community.isPrivate ? "secondary" : "outline"}
                        className="bg-black/50 text-white border-0"
                      >
                        {community.isPrivate ? <Lock className="size-3 mr-1" /> : <Globe className="size-3 mr-1" />}
                        {community.isPrivate ? "Private" : "Public"}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <h2 className="font-semibold text-lg">c/{community.name}</h2>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {community.description || "No description"}
                    </p>

                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="size-4" />
                        {community._count.members}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="size-4" />
                        {new Date(community.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={createModal} onOpenChange={setCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Community</DialogTitle>
            <DialogDescription>Create a new community for people to join and share.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Community Name *</Label>
              <div className="flex items-center mt-1">
                <span className="text-gray-500 mr-1">c/</span>
                <Input
                  value={newCommunity.name}
                  onChange={(e) =>
                    setNewCommunity({ ...newCommunity, name: e.target.value.toLowerCase().replace(/\s+/g, "_") })
                  }
                  placeholder="community_name"
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newCommunity.description}
                onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                placeholder="What is this community about?"
                maxLength={500}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="private"
                checked={newCommunity.isPrivate}
                onChange={(e) => setNewCommunity({ ...newCommunity, isPrivate: e.target.checked })}
              />
              <Label htmlFor="private" className="cursor-pointer">
                Private community (only members can see posts)
              </Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newCommunity.name.trim() || createLoading}>
                {createLoading ? "Creating..." : "Create Community"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
