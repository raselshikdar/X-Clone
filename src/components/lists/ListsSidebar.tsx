"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface List {
  id: string;
  name: string;
  isPrivate: boolean;
  memberCount: number;
}

interface ListsSidebarProps {
  className?: string;
  onCreateList?: () => void;
}

export function ListsSidebar({ className, onCreateList }: ListsSidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [lists, setLists] = React.useState<List[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && lists.length === 0) {
      fetchLists();
    }
  }, [isOpen]);

  const fetchLists = async () => {
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
  };

  return (
    <div className={cn("w-full", className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              "flex items-center justify-between w-full",
              "px-4 py-3",
              "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
              "transition-colors duration-200",
              "text-twitter-secondary dark:text-twitter-secondary-dark",
              "font-bold"
            )}
          >
            <div className="flex items-center gap-2">
              <List className="size-5" />
              <span>Lists</span>
            </div>
            {isOpen ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t border-twitter-border dark:border-twitter-border-dark">
            {isLoading ? (
              <div className="p-4 text-center text-twitter-secondary dark:text-twitter-secondary-dark text-sm">
                Loading...
              </div>
            ) : lists.length === 0 ? (
              <div className="p-4">
                <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark mb-3">
                  You haven&apos;t created any lists yet
                </p>
                {onCreateList && (
                  <Button
                    onClick={onCreateList}
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full"
                  >
                    <Plus className="size-4 mr-2" />
                    Create a list
                  </Button>
                )}
              </div>
            ) : (
              <>
                {lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className={cn(
                      "flex items-center gap-3",
                      "px-4 py-3",
                      "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
                      "transition-colors duration-200"
                    )}
                  >
                    <div className="w-8 h-8 rounded bg-twitter-gray dark:bg-twitter-gray-dark flex items-center justify-center">
                      <List className="size-4 text-twitter-secondary dark:text-twitter-secondary-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium truncate">
                        {list.name}
                      </p>
                      <p className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
                        {list.memberCount.toLocaleString()}{" "}
                        {list.memberCount === 1 ? "member" : "members"}
                      </p>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/lists"
                  className={cn(
                    "block px-4 py-3",
                    "text-twitter-blue",
                    "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
                    "transition-colors duration-200"
                  )}
                >
                  Show all
                </Link>
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
