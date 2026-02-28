"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Repeat2,
  UserPlus,
  AtSign,
  MessageCircle,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/common/Avatar";
import { VerifiedBadge, VerificationType } from "@/components/verification";

export interface NotificationActor {
  id: string;
  username: string;
  name: string;
  avatar: string | null;
  verified?: boolean;
  verificationType?: VerificationType;
}

export interface NotificationTweet {
  id: string;
  content: string | null;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
    verified?: boolean;
    verificationType?: VerificationType;
  };
  media?: Array<{
    id: string;
    type: string;
    url: string;
    thumbnail?: string | null;
  }>;
  inReplyTo?: {
    id: string;
    content: string | null;
    authorName: string;
  } | null;
}

export interface Notification {
  id: string;
  type: "like" | "retweet" | "follow" | "mention" | "reply" | "quote";
  read: boolean;
  createdAt: Date;
  actor: NotificationActor;
  tweet?: NotificationTweet | null;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "now";
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;

  const d = new Date(date);
  return `${d.getMonth() + 1} ${d.getDate()}`;
}

function truncateContent(content: string | null, maxLength: number = 100): string {
  if (!content) return "";
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + "...";
}

export function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {
  const router = useRouter();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "like":
        return <Heart className="size-5 text-pink-500 fill-pink-500" />;
      case "retweet":
        return <Repeat2 className="size-5 text-green-500" />;
      case "follow":
        return <UserPlus className="size-5 text-twitter-blue" />;
      case "mention":
        return <AtSign className="size-5 text-twitter-blue" />;
      case "reply":
        return <MessageCircle className="size-5 text-twitter-blue" />;
      case "quote":
        return <Quote className="size-5 text-twitter-blue" />;
      default:
        return null;
    }
  };

  const getNotificationText = () => {
    const actorName = notification.actor.name;
    const actorUsername = notification.actor.username;
    const showBadge = notification.actor.verified && notification.actor.verificationType;

    const nameWithBadge = (
      <>
        <Link
          href={`/profile/${actorUsername}`}
          className="font-bold hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {actorName}
        </Link>
        {showBadge && (
          <VerifiedBadge type={notification.actor.verificationType!} size="sm" />
        )}
      </>
    );

    switch (notification.type) {
      case "like":
        return (
          <>
            {nameWithBadge} liked your post
          </>
        );
      case "retweet":
        return (
          <>
            {nameWithBadge} reposted your post
          </>
        );
      case "follow":
        return (
          <>
            {nameWithBadge} followed you
          </>
        );
      case "mention":
        return (
          <>
            {nameWithBadge} mentioned you in a post
          </>
        );
      case "reply":
        return (
          <>
            {nameWithBadge} replied to your post
          </>
        );
      case "quote":
        return (
          <>
            {nameWithBadge} quoted your post
          </>
        );
      default:
        return null;
    }
  };

  const handleClick = async () => {
    // Mark as read
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to relevant content
    if (notification.type === "follow") {
      router.push(`/profile/${notification.actor.username}`);
    } else if (notification.tweet) {
      router.push(`/tweet/${notification.tweet.id}`);
    }
  };

  const getNavigationHref = () => {
    if (notification.type === "follow") {
      return `/profile/${notification.actor.username}`;
    } else if (notification.tweet) {
      return `/tweet/${notification.tweet.id}`;
    }
    return "#";
  };

  return (
    <Link
      href={getNavigationHref()}
      onClick={handleClick}
      className={cn(
        "flex gap-3 px-4 py-3",
        "border-b border-twitter-border dark:border-twitter-border-dark",
        "hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark",
        "transition-colors duration-200",
        !notification.read && "bg-twitter-blue/5"
      )}
    >
      {/* Icon indicator */}
      <div className="flex justify-center w-10">
        {getNotificationIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Actor avatar */}
        <div className="flex items-start gap-3">
          <Link
            href={`/profile/${notification.actor.username}`}
            onClick={(e) => e.stopPropagation()}
          >
            <UserAvatar
              src={notification.actor.avatar}
              alt={notification.actor.name}
              fallback={notification.actor.name}
              size="md"
            />
          </Link>

          <div className="flex-1 min-w-0">
            {/* Notification text */}
            <p className="text-[15px] leading-normal">
              {getNotificationText()}
            </p>

            {/* Tweet preview if applicable */}
            {notification.tweet && (
              <div className="mt-2">
                <p className="text-twitter-secondary dark:text-twitter-secondary-dark text-[15px]">
                  {truncateContent(notification.tweet.content)}
                </p>

                {/* Media preview */}
                {notification.tweet.media && notification.tweet.media.length > 0 && (
                  <div className="mt-2 flex gap-1">
                    {notification.tweet.media.slice(0, 4).map((media) => (
                      <div
                        key={media.id}
                        className="w-16 h-16 rounded-lg overflow-hidden bg-twitter-border dark:bg-twitter-border-dark"
                      >
                        {media.type === "image" ? (
                          <img
                            src={media.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <video
                              src={media.url}
                              poster={media.thumbnail || ""}
                              className="max-w-full max-h-full"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply context */}
                {notification.tweet.inReplyTo && notification.type === "reply" && (
                  <p className="mt-1 text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
                    Replying to{" "}
                    <span className="text-twitter-blue">
                      @{notification.tweet.inReplyTo.authorName}
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Timestamp */}
            <p className="mt-1 text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
              {formatRelativeTime(notification.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="w-2.5 h-2.5 rounded-full bg-twitter-blue mt-2" />
      )}
    </Link>
  );
}
