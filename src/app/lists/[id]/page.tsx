"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Lock, Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/common/Avatar";
import { TweetCard } from "@/components/common/TweetCard";
import { ListMembers, CreateListModal } from "@/components/lists";
import { toast } from "sonner";

interface List {
  id: string;
  name: string;
  description?: string | null;
  isPrivate: boolean;
  memberCount: number;
  isOwner: boolean;
  members: Member[];
  owner: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
  };
}

interface Member {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  verified: boolean;
  bio?: string | null;
  addedAt: string;
}

interface Tweet {
  id: string;
  content: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
  };
  media: any[];
  _count: {
    likes: number;
    retweetRecords: number;
    replies: number;
  };
  isLiked: boolean;
  isBookmarked: boolean;
  isRetweeted: boolean;
  views: number;
}

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listId = params.id as string;

  const [list, setList] = React.useState<List | null>(null);
  const [tweets, setTweets] = React.useState<Tweet[]>([]);
  const [isLoadingList, setIsLoadingList] = React.useState(true);
  const [isLoadingTweets, setIsLoadingTweets] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const fetchList = React.useCallback(async () => {
    setIsLoadingList(true);
    try {
      const response = await fetch(`/api/lists/${listId}`);
      if (response.ok) {
        const data = await response.json();
        setList(data.list);
      } else {
        router.push("/lists");
      }
    } catch (error) {
      console.error("Error fetching list:", error);
    } finally {
      setIsLoadingList(false);
    }
  }, [listId, router]);

  const fetchTweets = React.useCallback(async (cursor?: string) => {
    setIsLoadingTweets(true);
    try {
      const url = `/api/lists/${listId}/tweets?limit=20${cursor ? `&cursor=${cursor}` : ""}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (cursor) {
          setTweets((prev) => [...prev, ...data.tweets]);
        } else {
          setTweets(data.tweets);
        }
        setNextCursor(data.nextCursor);
      }
    } catch (error) {
      console.error("Error fetching list tweets:", error);
    } finally {
      setIsLoadingTweets(false);
    }
  }, [listId]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  React.useEffect(() => {
    if (list) {
      fetchTweets();
    }
  }, [list]);

  const handleEditList = async (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => {
    const response = await fetch(`/api/lists/${listId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update list");
    }

    const result = await response.json();
    setList((prev) => (prev ? { ...prev, ...result.list } : null));
    toast.success("List updated successfully");
  };

  const handleDeleteList = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || "Failed to delete list");
        return;
      }

      toast.success("List deleted successfully");
      router.push("/lists");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    const response = await fetch(`/api/lists/${listId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to add member");
    }

    const result = await response.json();
    setList((prev) =>
      prev
        ? {
            ...prev,
            members: [result.member, ...prev.members],
            memberCount: prev.memberCount + 1,
          }
        : null
    );
  };

  const handleRemoveMember = async (userId: string) => {
    const response = await fetch(
      `/api/lists/${listId}/members?userId=${userId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to remove member");
    }

    setList((prev) =>
      prev
        ? {
            ...prev,
            members: prev.members.filter((m) => m.id !== userId),
            memberCount: prev.memberCount - 1,
          }
        : null
    );
  };

  if (isLoadingList) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark p-4">
          <div className="animate-pulse">
            <div className="h-6 w-32 bg-twitter-hover dark:bg-twitter-hover-dark rounded mb-2" />
            <div className="h-4 w-48 bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{list.name}</h1>
                {list.isPrivate && (
                  <Lock className="size-4 text-twitter-secondary dark:text-twitter-secondary-dark" />
                )}
              </div>
              <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
                {list.memberCount.toLocaleString()}{" "}
                {list.memberCount === 1 ? "member" : "members"}
              </p>
            </div>
          </div>
          {list.isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-full hover:bg-twitter-blue/10 hover:text-twitter-blue"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                  <Pencil className="size-4 mr-2" />
                  Edit list
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete list
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* List info */}
      <div className="p-4 border-b border-twitter-border dark:border-twitter-border-dark">
        {list.description && (
          <p className="text-[15px] mb-2">{list.description}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
          <Link
            href={`/${list.owner.username}`}
            className="flex items-center gap-1 hover:underline"
          >
            <UserAvatar
              src={list.owner.avatar}
              alt={list.owner.displayName || list.owner.username}
              fallback={list.owner.displayName || list.owner.username}
              size="sm"
            />
            <span>{list.owner.displayName || list.owner.username}</span>
          </Link>
          <span>·</span>
          <span>Created this list</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tweets" className="w-full">
        <TabsList className="w-full justify-start border-b border-twitter-border dark:border-twitter-border-dark bg-transparent p-0">
          <TabsTrigger
            value="tweets"
            className={cn(
              "data-[state=active]:border-b-2 data-[state=active]:border-twitter-blue data-[state=active]:shadow-none",
              "rounded-none px-4 py-3 font-bold bg-transparent"
            )}
          >
            Tweets
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className={cn(
              "data-[state=active]:border-b-2 data-[state=active]:border-twitter-blue data-[state=active]:shadow-none",
              "rounded-none px-4 py-3 font-bold bg-transparent"
            )}
          >
            Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tweets" className="mt-0">
          {isLoadingTweets && tweets.length === 0 ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="size-10 rounded-full bg-twitter-hover dark:bg-twitter-hover-dark" />
                  <div className="flex-1">
                    <div className="h-4 w-32 bg-twitter-hover dark:bg-twitter-hover-dark rounded mb-2" />
                    <div className="h-3 w-full bg-twitter-hover dark:bg-twitter-hover-dark rounded mb-1" />
                    <div className="h-3 w-3/4 bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : tweets.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-twitter-secondary dark:text-twitter-secondary-dark">
                No tweets yet. Add members to see their tweets here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
              {tweets.map((tweet) => (
                <TweetCard key={tweet.id} tweet={tweet} />
              ))}
              {nextCursor && (
                <button
                  onClick={() => fetchTweets(nextCursor)}
                  disabled={isLoadingTweets}
                  className="w-full p-4 text-twitter-blue hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark transition-colors"
                >
                  {isLoadingTweets ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-0">
          <ListMembers
            listId={listId}
            isOwner={list.isOwner}
            members={list.members}
            onAddMember={list.isOwner ? handleAddMember : undefined}
            onRemoveMember={list.isOwner ? handleRemoveMember : undefined}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <CreateListModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSubmit={handleEditList}
        editData={{
          id: list.id,
          name: list.name,
          description: list.description,
          isPrivate: list.isPrivate,
        }}
      />

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete list?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this list and remove all members from
              it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
