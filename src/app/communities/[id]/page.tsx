"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  Settings,
  Calendar,
  Lock,
  Globe,
  Plus,
  MoreHorizontal,
  Crown,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TweetCard } from "@/components/common/TweetCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function CommunityPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [community, setCommunity] = useState<any>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [joinLoading, setJoinLoading] = useState(false);

  const communityId = params.id as string;

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const response = await fetch(`/api/communities/${communityId}`);
        if (response.ok) {
          const data = await response.json();
          setCommunity(data.community);
        } else {
          router.push("/communities");
        }
      } catch (error) {
        console.error("Failed to fetch community:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunity();
  }, [communityId, router]);

  useEffect(() => {
    if (activeTab === "posts") {
      fetchTweets();
    } else if (activeTab === "members") {
      fetchMembers();
    }
  }, [activeTab, communityId]);

  const fetchTweets = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/tweets`);
      if (response.ok) {
        const data = await response.json();
        setTweets(data.tweets);
      }
    } catch (error) {
      console.error("Failed to fetch tweets:", error);
    }
  };

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error("Failed to fetch members:", error);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in to join", variant: "destructive" });
      return;
    }

    setJoinLoading(true);
    try {
      const response = await fetch(`/api/communities/${communityId}/join`, {
        method: community?.isMember ? "DELETE" : "POST",
      });

      if (response.ok) {
        setCommunity({
          ...community,
          isMember: !community?.isMember,
          _count: {
            ...community._count,
            members: community?.isMember ? community._count.members - 1 : community._count.members + 1,
          },
        });
        toast({
          title: community?.isMember ? "Left community" : "Joined community",
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update membership", variant: "destructive" });
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-48 bg-gray-200" />
        <div className="p-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!community) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="size-4 text-yellow-500" />;
      case "admin":
        return <Shield className="size-4 text-blue-500" />;
      default:
        return <User className="size-4 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 relative">
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

      {/* Header */}
      <div className="border-b px-4 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">c/{community.name}</h1>
            <p className="text-gray-500 mt-1">{community.description || "No description"}</p>
          </div>

          <div className="flex items-center gap-2">
            {community.userRole === "owner" || community.userRole === "admin" ? (
              <Link href={`/communities/${communityId}/settings`}>
                <Button variant="outline" size="sm">
                  <Settings className="size-4 mr-1" />
                  Settings
                </Button>
              </Link>
            ) : null}
            <Button onClick={handleJoin} disabled={joinLoading}>
              {joinLoading ? "..." : community.isMember ? "Joined" : "Join"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="size-4" />
            {community._count?.members || 0} members
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="size-4" />
            Created {new Date(community.createdAt).toLocaleDateString()}
          </span>
          <span>
            Owner:{" "}
            <Link href={`/${community.owner.username}`} className="text-blue-500 hover:underline">
              @{community.owner.username}
            </Link>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="border-b">
        <TabsList className="bg-transparent w-full justify-start rounded-none p-0">
          <TabsTrigger
            value="posts"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            Members
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
          >
            About
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      <div className="p-4">
        <TabsContent value="posts" className="mt-0">
          {community.isMember || !community.isPrivate ? (
            <>
              {tweets.length === 0 ? (
                <div className="text-center py-12">
                  <Building2 className="size-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">No posts yet</h3>
                  <p className="text-gray-500">Be the first to post in this community!</p>
                </div>
              ) : (
                tweets.map((tweet) => (
                  <TweetCard
                    key={tweet.id}
                    tweet={{
                      id: tweet.id,
                      user: {
                        id: tweet.author.id,
                        name: tweet.author.displayName || tweet.author.username,
                        username: tweet.author.username,
                        avatar: tweet.author.avatar,
                        verified: tweet.author.verified,
                      },
                      content: tweet.content || "",
                      media: tweet.media,
                      createdAt: new Date(tweet.createdAt),
                      replies: tweet._count?.replies || 0,
                      retweets: tweet._count?.retweets || 0,
                      likes: tweet._count?.likes || 0,
                    }}
                  />
                ))
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Lock className="size-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">Private Community</h3>
              <p className="text-gray-500">Join to see posts.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-0">
          <div className="space-y-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <Link href={`/${member.user.username}`} className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {member.user.avatar ? (
                      <img src={member.user.avatar} alt="" className="size-10 object-cover" />
                    ) : (
                      <span>{(member.user.displayName || member.user.username)[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-1">
                      {member.user.displayName || member.user.username}
                      {getRoleIcon(member.role)}
                    </div>
                    <div className="text-sm text-gray-500">@{member.user.username}</div>
                  </div>
                </Link>
                <Badge variant="outline">{member.role}</Badge>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="about" className="mt-0">
          <div className="prose dark:prose-invert max-w-none">
            <h3>About this community</h3>
            <p>{community.description || "No description provided."}</p>

            {community.rules && community.rules.length > 0 && (
              <>
                <h3>Rules</h3>
                <ol>
                  {community.rules.map((rule: string, i: number) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ol>
              </>
            )}
          </div>
        </TabsContent>
      </div>
    </div>
  );
}
