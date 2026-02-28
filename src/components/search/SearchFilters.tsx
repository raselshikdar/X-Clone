"use client";

import * as React from "react";
import { Calendar, MapPin, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface SearchFiltersProps {
  onFilterChange?: (filters: SearchFilters) => void;
  className?: string;
}

interface SearchFilters {
  from?: string;
  to?: string;
  hashtag?: string;
  hasMedia?: boolean;
  hasImages?: boolean;
  hasVideos?: boolean;
  minLikes?: number;
  since?: Date;
  until?: Date;
}

export function SearchFilters({ onFilterChange, className }: SearchFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<SearchFilters>({});
  const [fromUser, setFromUser] = React.useState("");
  const [toUser, setToUser] = React.useState("");
  const [hashtag, setHashtag] = React.useState("");
  const [sinceDate, setSinceDate] = React.useState<Date | undefined>();
  const [untilDate, setUntilDate] = React.useState<Date | undefined>();

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const applyFilters = () => {
    const newFilters: SearchFilters = {};

    if (fromUser.trim()) {
      newFilters.from = fromUser.trim();
    }
    if (toUser.trim()) {
      newFilters.to = toUser.trim();
    }
    if (hashtag.trim()) {
      newFilters.hashtag = hashtag.trim();
    }
    if (sinceDate) {
      newFilters.since = sinceDate;
    }
    if (untilDate) {
      newFilters.until = untilDate;
    }

    setFilters(newFilters);
    onFilterChange?.(newFilters);
    setIsOpen(false);
  };

  const clearFilters = () => {
    setFilters({});
    setFromUser("");
    setToUser("");
    setHashtag("");
    setSinceDate(undefined);
    setUntilDate(undefined);
    onFilterChange?.({});
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "rounded-full font-bold",
            activeFilterCount > 0 && "border-twitter-blue text-twitter-blue",
            className
          )}
        >
          {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} active` : "Advanced filters"}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-4"
        align="start"
      >
        <div className="space-y-4">
          <h4 className="font-bold text-lg">Advanced filters</h4>

          {/* From user */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-twitter-secondary dark:text-twitter-secondary-dark flex items-center gap-2">
              <User className="size-4" />
              From these accounts
            </label>
            <Input
              placeholder="username"
              value={fromUser}
              onChange={(e) => setFromUser(e.target.value.replace("@", ""))}
              className="h-10"
            />
          </div>

          {/* To user */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-twitter-secondary dark:text-twitter-secondary-dark flex items-center gap-2">
              <User className="size-4" />
              Replying to these accounts
            </label>
            <Input
              placeholder="username"
              value={toUser}
              onChange={(e) => setToUser(e.target.value.replace("@", ""))}
              className="h-10"
            />
          </div>

          {/* Hashtag */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-twitter-secondary dark:text-twitter-secondary-dark flex items-center gap-2">
              #
              All of these words
            </label>
            <Input
              placeholder="hashtag (without #)"
              value={hashtag}
              onChange={(e) => setHashtag(e.target.value.replace("#", ""))}
              className="h-10"
            />
          </div>

          {/* Date range */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-twitter-secondary dark:text-twitter-secondary-dark flex items-center gap-2">
              <Calendar className="size-4" />
              Date range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-twitter-secondary dark:text-twitter-secondary-dark">From</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-10 justify-start text-left font-normal",
                        !sinceDate && "text-muted-foreground"
                      )}
                    >
                      {sinceDate ? sinceDate.toLocaleDateString() : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={sinceDate}
                      onSelect={setSinceDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <span className="text-[11px] text-twitter-secondary dark:text-twitter-secondary-dark">To</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-10 justify-start text-left font-normal",
                        !untilDate && "text-muted-foreground"
                      )}
                    >
                      {untilDate ? untilDate.toLocaleDateString() : "Select"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={untilDate}
                      onSelect={setUntilDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-twitter-secondary dark:text-twitter-secondary-dark"
            >
              Clear all
            </Button>
            <Button
              onClick={applyFilters}
              className="bg-twitter-blue hover:bg-twitter-blue/90 rounded-full"
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
