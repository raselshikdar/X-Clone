"use client";

import * as React from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ListCard, CreateListModal } from "@/components/lists";
import { toast } from "sonner";

interface List {
  id: string;
  name: string;
  description?: string | null;
  isPrivate: boolean;
  memberCount: number;
  isOwner: boolean;
}

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = React.useState<List[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingList, setEditingList] = React.useState<List | null>(null);

  const fetchLists = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/lists");
      if (response.ok) {
        const data = await response.json();
        setLists(data.lists);
      }
    } catch (error) {
      console.error("Error fetching lists:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleCreateList = async (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => {
    const response = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create list");
    }

    const result = await response.json();
    setLists((prev) => [result.list, ...prev]);
    toast.success("List created successfully");
  };

  const handleEditList = async (data: {
    name: string;
    description?: string;
    isPrivate: boolean;
  }) => {
    if (!editingList) return;

    const response = await fetch(`/api/lists/${editingList.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update list");
    }

    const result = await response.json();
    setLists((prev) =>
      prev.map((list) =>
        list.id === editingList.id ? { ...list, ...result.list } : list
      )
    );
    setEditingList(null);
    toast.success("List updated successfully");
  };

  const handleDeleteList = async (id: string) => {
    const response = await fetch(`/api/lists/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      toast.error(error.error || "Failed to delete list");
      return;
    }

    setLists((prev) => prev.filter((list) => list.id !== id));
    toast.success("List deleted successfully");
  };

  const openEditModal = (id: string) => {
    const list = lists.find((l) => l.id === id);
    if (list) {
      setEditingList(list);
      setShowCreateModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-twitter-border dark:border-twitter-border-dark">
        <div className="flex items-center gap-6 p-2">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Lists</h1>
            <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
              @{lists.length} lists
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingList(null);
              setShowCreateModal(true);
            }}
            className="bg-black dark:bg-white text-white dark:text-black rounded-full font-bold h-9 px-4"
          >
            <Plus className="size-4 mr-2" />
            New list
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {/* Pinned section */}
        <div className="p-4 border-b border-twitter-border dark:border-twitter-border-dark">
          <h2 className="font-bold text-lg">Pinned Lists</h2>
          <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark mt-1">
            Pin up to 5 lists to the top of your timeline
          </p>
        </div>

        {/* Your lists */}
        <div>
          <div className="p-4 border-b border-twitter-border dark:border-twitter-border-dark">
            <h2 className="font-bold text-lg">Your lists</h2>
          </div>

          {isLoading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-32 bg-twitter-hover dark:bg-twitter-hover-dark rounded mb-2" />
                  <div className="h-3 w-48 bg-twitter-hover dark:bg-twitter-hover-dark rounded mb-1" />
                  <div className="h-3 w-20 bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
                </div>
              ))}
            </div>
          ) : lists.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-twitter-secondary dark:text-twitter-secondary-dark mb-4">
                You haven&apos;t created any lists yet
              </p>
              <Button
                onClick={() => {
                  setEditingList(null);
                  setShowCreateModal(true);
                }}
                className="bg-black dark:bg-white text-white dark:text-black rounded-full font-bold"
              >
                <Plus className="size-4 mr-2" />
                Create a list
              </Button>
            </div>
          ) : (
            lists.map((list) => (
              <ListCard
                key={list.id}
                {...list}
                onDelete={handleDeleteList}
                onEdit={openEditModal}
              />
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <CreateListModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) setEditingList(null);
        }}
        onSubmit={editingList ? handleEditList : handleCreateList}
        editData={
          editingList
            ? {
                id: editingList.id,
                name: editingList.name,
                description: editingList.description,
                isPrivate: editingList.isPrivate,
              }
            : undefined
        }
      />
    </div>
  );
}
