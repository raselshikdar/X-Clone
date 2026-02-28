"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MessageCircle,
  Repeat2,
  Heart,
  Share,
  BarChart3,
  Bookmark,
  MoreHorizontal,
  Trash2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { UserAvatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { ReplyComposer } from "@/components/tweet/ReplyComposer";
import { TweetCard } from "@/components/common/TweetCard";
import { MediaGrid, MediaLightbox } from "@/components/tweet/MediaGrid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Tweet } from "@/stores/tweetStore";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const hour = hours > 12 ? hours - 12 : hours || 12;
  const ampm = hours >= 12 ? "PM" : "AM";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${hour}:${minutes} ${ampm} · ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function TweetDetailPage() {
  const params = useParams();
  const tweetId = params.id as string;
  const { data: session } = useSession();

  const [tweet, setTweet] = React.useState<Tweet | null>(null);
  const [replies, setReplies] = React.useState<Tweet[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState(0);

  const fetchTweet = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tweets/${tweetId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tweet");
      }

      setTweet({
        ...data.tweet,
        createdAt: new Date(data.tweet.createdAt),
        inReplyTo: data.tweet.inReplyTo
          ? { ...data.tweet.inReplyTo, createdAt: new Date(data.tweet.inReplyTo.createdAt) }
          : null,
        quotedTweet: data.tweet.quotedTweet
          ? { ...data.tweet.quotedTweet, createdAt: new Date(data.tweet.quotedTweet.createdAt) }
          : null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tweet");
    } finally {
      setIsLoading(false);
    }
  }, [tweetId]);

  const fetchReplies = React.useCallback(async () => {
    try {
      const response = await fetch(`/api/tweets/${tweetId}/replies`);
      const data = await response.json();

      if (response.ok) {
        setReplies(
          data.replies.map((r: Tweet) => ({
            ...r,
            createdAt: new Date(r.createdAt),
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching replies:", err);
    }
  }, [tweetId]);

  React.useEffect(() => {
    fetchTweet();
    fetchReplies();
  }, [fetchTweet, fetchReplies]);

  const handleLike = async () => {
    if (!session?.user || !tweet) return;

    const method = tweet.isLiked ? "DELETE" : "POST";
    const endpoint = `/api/tweets/${tweetId}/like`;

    // Optimistic update
    setTweet((prev) =>
      prev
        ? {
            ...prev,
            isLiked: !prev.isLiked,
            _count: {
              ...prev._count,
              likes: prev.isLiked ? prev._count.likes - 1 : prev._count.likes + 1,
            },
          }
        : null
    );

    try {
      await fetch(endpoint, { method });
    } catch {
      // Revert on error
      fetchTweet();
    }
  };

  const handleRetweet = async () => {
    if (!session?.user || !tweet) return;

    const method = tweet.isRetweeted ? "DELETE" : "POST";
    const endpoint = `/api/tweets/${tweetId}/retweet`;

    // Optimistic update
    setTweet((prev) =>
      prev
        ? {
            ...prev,
            isRetweeted: !prev.isRetweeted,
            _count: {
              ...prev._count,
              retweets: prev.isRetweeted
                ? prev._count.retweets - 1
                : prev._count.retweets + 1,
            },
          }
        : null
    );

    try {
      await fetch(endpoint, { method });
    } catch {
      fetchTweet();
    }
  };

  const handleBookmark = async () => {
    if (!session?.user || !tweet) return;

    const method = tweet.isBookmarked ? "DELETE" : "POST";
    const endpoint = `/api/tweets/${tweetId}/bookmark`;

    // Optimistic update
    setTweet((prev) =>
      prev
        ? {
            ...prev,
            isBookmarked: !prev.isBookmarked,
          }
        : null
    );

    try {
      await fetch(endpoint, { method });
    } catch {
      fetchTweet();
    }
  };

  const handleDelete = async () => {
    if (!session?.user || !tweet) return;

    try {
      const response = await fetch(`/api/tweets/${tweetId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.history.back();
      }
    } catch (err) {
      console.error("Error deleting tweet:", err);
    }
  };

  const handleReplySuccess = () => {
    fetchReplies();
  };

  const handleMediaClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <div>
        <Header title="Post" />
        <div className="p-4">
          <div className="animate-pulse">
            <div className="flex gap-3">
              <div className="size-10 rounded-full bg-twitter-hover dark:bg-twitter-hover-dark" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
                <div className="h-4 w-24 bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-4 w-full bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
              <div className="h-4 w-3/4 bg-twitter-hover dark:bg-twitter-hover-dark rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !tweet) {
    return (
      <div>
        <Header title="Post" />
        <div className="p-4 text-center">
          <p className="text-twitter-secondary">
            {error || "Tweet not found"}
          </p>
          <Link href="/" className="text-twitter-blue hover:underline mt-2 inline-block">
            Go back home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Post" />

      {/* Parent tweet (if reply) */}
      {tweet.inReplyTo && (
        <div className="border-b border-twitter-border dark:border-twitter-border-dark">
          <div className="p-4 text-[15px] text-twitter-secondary">
            Replying to{" "}
            <Link
              href={`/profile/${tweet.inReplyTo.author.username}`}
              className="text-twitter-blue hover:underline"
            >
              @{tweet.inReplyTo.author.username}
            </Link>
          </div>
        </div>
      )}

      {/* Main tweet */}
      <article className="p-4 border-b border-twitter-border dark:border-twitter-border-dark">
        {/* Author info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${tweet.author.username}`}>
              <UserAvatar
                src={tweet.author.avatar}
                alt={tweet.author.name}
                fallback={tweet.author.name}
                size="lg"
              />
            </Link>
            <div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/profile/${tweet.author.username}`}
                  className="font-bold text-[15px] hover:underline"
                >
                  {tweet.author.name}
                </Link>
                {tweet.author.verified && (
                  <CheckCircle2 className="size-[18px] text-twitter-blue fill-twitter-blue" />
                )}
              </div>
              <Link
                href={`/profile/${tweet.author.username}`}
                className="text-twitter-secondary text-[15px] hover:underline"
              >
                @{tweet.author.username}
              </Link>
            </div>
          </div>

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full size-8 hover:bg-twitter-blue/10 hover:text-twitter-blue"
              >
                <MoreHorizontal className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {session?.user?.id === tweet.author.id && (
                <>
                  <DropdownMenuItem
                    className="text-red-500 gap-3"
                    onClick={handleDelete}
                  >
                    <Trash2 className="size-5" />
                    Delete
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem className="gap-3">
                <Bookmark className="size-5" />
                {tweet.isBookmarked ? "Remove from Bookmarks" : "Bookmark"}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-3">
                <Share className="size-5" />
                Copy link to post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="mt-4 text-xl whitespace-pre-wrap break-words">
          {tweet.content?.split(/(\s+)/).map((part, index) => {
            if (part.startsWith("@")) {
              return (
                <Link
                  key={index}
                  href={`/profile/${part.slice(1)}`}
                  className="text-twitter-blue hover:underline"
                >
                  {part}
                </Link>
              );
            }
            if (part.startsWith("#")) {
              return (
                <Link
                  key={index}
                  href={`/search?q=${encodeURIComponent(part)}`}
                  className="text-twitter-blue hover:underline"
                >
                  {part}
                </Link>
              );
            }
            if (part.startsWith("http://") || part.startsWith("https://")) {
              try {
                const url = new URL(part);
                return (
                  <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-twitter-blue hover:underline"
                  >
                    {url.hostname}
                  </a>
                );
              } catch {
                return part;
              }
            }
            return part;
          })}
        </div>

        {/* Media */}
        {tweet.media && tweet.media.length > 0 && (
          <div className="mt-4">
            <MediaGrid
              media={tweet.media}
              onMediaClick={handleMediaClick}
            />
          </div>
        )}

        {/* Date and views */}
        <div className="mt-4 text-[15px] text-twitter-secondary">
          {formatDate(tweet.createdAt)}
          {tweet.views > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-twitter-main dark:text-white">
                {formatNumber(tweet.views)}
              </span>{" "}
              Views
            </>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 py-3 flex gap-5 border-y border-twitter-border dark:border-twitter-border-dark text-[15px]">
          <div>
            <span className="font-semibold">{formatNumber(tweet._count.retweets)}</span>{" "}
            <span className="text-twitter-secondary">Reposts</span>
          </div>
          <div>
            <span className="font-semibold">{formatNumber(tweet._count.likes)}</span>{" "}
            <span className="text-twitter-secondary">Likes</span>
          </div>
          <div>
            <span className="font-semibold">{formatNumber(tweet._count.replies)}</span>{" "}
            <span className="text-twitter-secondary">Replies</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-1 flex items-center justify-around py-1">
          <button
            className={cn(
              "flex items-center gap-1 group",
              "p-2 rounded-full",
              "hover:bg-twitter-blue/10",
              "text-twitter-secondary",
              "hover:text-twitter-blue",
              "transition-colors duration-200"
            )}
          >
            <MessageCircle className="size-5" />
          </button>

          <button
            onClick={handleRetweet}
            className={cn(
              "flex items-center gap-1 group",
              "p-2 rounded-full",
              "hover:bg-green-500/10",
              "text-twitter-secondary",
              tweet.isRetweeted ? "text-green-500" : "hover:text-green-500",
              "transition-colors duration-200"
            )}
          >
            <Repeat2 className={cn("size-5", tweet.isRetweeted && "fill-green-500/10")} />
          </button>

          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1 group",
              "p-2 rounded-full",
              "hover:bg-pink-500/10",
              "text-twitter-secondary",
              tweet.isLiked ? "text-pink-500" : "hover:text-pink-500",
              "transition-colors duration-200"
            )}
          >
            <Heart className={cn("size-5", tweet.isLiked && "fill-pink-500")} />
          </button>

          <button
            onClick={handleBookmark}
            className={cn(
              "flex items-center gap-1 group",
              "p-2 rounded-full",
              "hover:bg-twitter-blue/10",
              "text-twitter-secondary",
              "hover:text-twitter-blue",
              "transition-colors duration-200"
            )}
          >
            <Bookmark
              className={cn("size-5", tweet.isBookmarked && "fill-twitter-blue text-twitter-blue")}
            />
          </button>

          <button
            className={cn(
              "flex items-center gap-1 group",
              "p-2 rounded-full",
              "hover:bg-twitter-blue/10",
              "text-twitter-secondary",
              "hover:text-twitter-blue",
              "transition-colors duration-200"
            )}
          >
            <Share className="size-5" />
          </button>
        </div>
      </article>

      {/* Reply composer */}
      {session?.user && (
        <div className="border-b border-twitter-border dark:border-twitter-border-dark">
          <ReplyComposer tweet={tweet} onSuccess={handleReplySuccess} inline />
        </div>
      )}

      {/* Replies */}
      <div>
        {replies.length === 0 ? (
          <div className="p-8 text-center text-twitter-secondary">
            No replies yet. Be the first to reply!
          </div>
        ) : (
          replies.map((reply) => (
            <TweetCard
              key={reply.id}
              tweet={{
                id: reply.id,
                user: {
                  id: reply.author.id,
                  name: reply.author.name,
                  username: reply.author.username,
                  avatar: reply.author.avatar,
                  verified: reply.author.verified,
                },
                content: reply.content || "",
                media: reply.media?.map((m) => ({
                  id: m.id,
                  type: m.type,
                  url: m.url,
                  thumbnail: m.thumbnail,
                })),
                createdAt: reply.createdAt,
                replies: reply._count.replies,
                retweets: reply._count.retweets,
                likes: reply._count.likes,
                views: reply.views,
                isLiked: reply.isLiked,
                isRetweeted: reply.isRetweeted,
                isBookmarked: reply.isBookmarked,
              }}
            />
          ))
        )}
      </div>

      {/* Media lightbox */}
      {tweet.media && tweet.media.length > 0 && (
        <MediaLightbox
          media={tweet.media}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </div>
  );
}
