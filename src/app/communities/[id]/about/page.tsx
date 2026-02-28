"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Shield, Calendar, FileText, Crown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/common/Avatar";
import { CommunityTabs } from "@/components/communities";
import Link from "next/link";

interface Admin {
  id: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
  };
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  rules: string[];
  createdAt: string;
  owner: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    verified: boolean;
  };
}

export default function CommunityAboutPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<Community | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunity();
    fetchAdmins();
  }, [communityId]);

  const fetchCommunity = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      if (response.ok) {
        const data = await response.json();
        setCommunity(data.community);
      }
    } catch (error) {
      console.error("Error fetching community:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}/admins`);
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-[600px] mx-auto p-4 text-center">
        Community not found
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Back button */}
      <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-20 px-4 py-2 flex items-center gap-6 border-b border-twitter-border dark:border-twitter-border-dark">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-bold text-lg">{community.name}</h1>
      </div>

      {/* Tabs */}
      <CommunityTabs communityId={communityId} />

      <div className="p-4 space-y-6">
        {/* Description */}
        {community.description && (
          <section>
            <h2 className="font-bold text-lg mb-2">About</h2>
            <p className="text-[15px] whitespace-pre-wrap">
              {community.description}
            </p>
          </section>
        )}

        {/* Created date */}
        <section className="flex items-center gap-2 text-twitter-secondary dark:text-twitter-secondary-dark">
          <Calendar className="size-5" />
          <span>Created {formatDate(community.createdAt)}</span>
        </section>

        {/* Rules */}
        {community.rules.length > 0 && (
          <section>
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <FileText className="size-5" />
              Rules
            </h2>
            <ol className="space-y-3">
              {community.rules.map((rule, index) => (
                <li
                  key={index}
                  className="flex gap-3 p-3 rounded-xl bg-twitter-hover dark:bg-twitter-hover-dark"
                >
                  <span className="font-bold text-twitter-blue">
                    {index + 1}.
                  </span>
                  <span className="text-[15px]">{rule}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Admins */}
        <section>
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Shield className="size-5" />
            Admins & Moderators
          </h2>
          <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark rounded-xl overflow-hidden border border-twitter-border dark:border-twitter-border-dark">
            {admins.map((admin) => (
              <Link
                key={admin.id}
                href={`/${admin.user.username}`}
                className="flex items-center gap-3 p-3 hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
              >
                <UserAvatar
                  src={admin.user.avatar}
                  alt={admin.user.displayName || admin.user.username}
                  fallback={admin.user.displayName || admin.user.username}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[15px] truncate">
                      {admin.user.displayName || admin.user.username}
                    </span>
                    {admin.user.verified && (
                      <Crown className="size-4 text-twitter-blue fill-twitter-blue" />
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        admin.role === "owner"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-500"
                      }`}
                    >
                      {admin.role === "owner" ? (
                        <Crown className="size-3" />
                      ) : (
                        <Shield className="size-3" />
                      )}
                      {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                    </span>
                  </div>
                  <span className="text-twitter-secondary dark:text-twitter-secondary-dark text-[13px]">
                    @{admin.user.username}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
