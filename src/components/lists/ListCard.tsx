"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, Lock, Users, Pencil, Trash2 } from "lucide-react";
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

interface ListCardProps {
  id: string;
  name: string;
  description?: string | null;
  isPrivate: boolean;
  memberCount: number;
  isOwner: boolean;
  showActions?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function ListCard({
  id,
  name,
  description,
  isPrivate,
  memberCount,
  isOwner,
  showActions = true,
  onDelete,
  onEdit,
}: ListCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(id);
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "group flex items-start justify-between gap-4",
          "p-4",
          "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
          "transition-colors duration-200",
          "border-b border-twitter-border dark:border-twitter-border-dark"
        )}
      >
        <Link href={`/lists/${id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[15px] truncate">{name}</h3>
            {isPrivate && (
              <Lock className="size-4 text-twitter-secondary dark:text-twitter-secondary-dark flex-shrink-0" />
            )}
          </div>
          {description && (
            <p className="text-[15px] text-twitter-secondary dark:text-twitter-secondary-dark mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center gap-1 mt-1 text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
            <Users className="size-3.5" />
            <span>
              {memberCount.toLocaleString()}{" "}
              {memberCount === 1 ? "member" : "members"}
            </span>
          </div>
        </Link>

        {isOwner && showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-twitter-blue/10 hover:text-twitter-blue"
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">List options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(id)}>
                  <Pencil className="size-4 mr-2" />
                  Edit list
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete list
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

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
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
