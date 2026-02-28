"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  BadgeCheck,
  Building2,
  Landmark,
  Clock,
  ExternalLink,
  Users,
  FileText,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VerificationRequest {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  businessName?: string;
  businessWebsite?: string;
  businessCategory?: string;
  officialEmail?: string;
  agencyName?: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    email: string;
    avatar: string | null;
    verified: boolean;
    createdAt: string;
    _count: {
      tweets: number;
      followers: number;
    };
  };
}

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/verification/admin/pending?${params}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [typeFilter]);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      const response = await fetch(`/api/verification/admin/${id}/approve`, {
        method: "POST",
      });

      if (response.ok) {
        toast({ title: "Approved", description: "Verification request approved." });
        fetchRequests();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to approve",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setProcessing(id);
    try {
      const response = await fetch(`/api/verification/admin/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast({ title: "Rejected", description: "Verification request rejected." });
        fetchRequests();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reject",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blue":
        return <BadgeCheck className="size-5 text-[#1d9bf0]" />;
      case "gold":
        return <Building2 className="size-5 text-[#e2b719]" />;
      case "gray":
      case "government":
        return <Landmark className="size-5 text-[#8b98a5]" />;
      default:
        return <BadgeCheck className="size-5" />;
    }
  };

  return (
    <AdminLayout activeTab="verification">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Verification Requests</h1>
            <p className="text-gray-500">Review and approve verification applications</p>
          </div>
          <Badge variant="secondary" className="text-lg">
            {requests.length} pending
          </Badge>
        </div>

        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="blue" className="gap-1">
              <BadgeCheck className="size-4" />
              Blue
            </TabsTrigger>
            <TabsTrigger value="gold" className="gap-1">
              <Building2 className="size-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="government" className="gap-1">
              <Landmark className="size-4" />
              Government
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="size-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                </div>
              </div>
            ))
          ) : requests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
              <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">All caught up!</h3>
              <p className="text-gray-500">No pending verification requests.</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request.id} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* User Avatar */}
                    <Link href={`/${request.user.username}`}>
                      <div className="size-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {request.user.avatar ? (
                          <img src={request.user.avatar} alt="" className="size-12 object-cover" />
                        ) : (
                          <span className="text-lg">
                            {(request.user.displayName || request.user.username)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/${request.user.username}`}
                          className="font-semibold hover:underline"
                        >
                          {request.user.displayName || request.user.username}
                        </Link>
                        {getTypeIcon(request.type)}
                        <span className="text-gray-500">@{request.user.username}</span>
                        <Badge variant="outline">{request.type}</Badge>
                      </div>

                      <div className="text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Applied {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Verification Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {request.type === "gold" && (
                          <>
                            <div>
                              <span className="text-gray-500">Business:</span>{" "}
                              {request.businessName}
                            </div>
                            <div>
                              <span className="text-gray-500">Website:</span>{" "}
                              <a
                                href={request.businessWebsite}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center gap-1"
                              >
                                {request.businessWebsite}
                                <ExternalLink className="size-3" />
                              </a>
                            </div>
                            <div>
                              <span className="text-gray-500">Category:</span>{" "}
                              {request.businessCategory}
                            </div>
                          </>
                        )}
                        {request.type === "government" && (
                          <>
                            <div>
                              <span className="text-gray-500">Agency:</span> {request.agencyName}
                            </div>
                            <div>
                              <span className="text-gray-500">Official Email:</span>{" "}
                              {request.officialEmail}
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="size-3 text-gray-400" />
                          {request.user._count.followers.toLocaleString()} followers
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="size-3 text-gray-400" />
                          {request.user._count.tweets.toLocaleString()} posts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(request.id, "Not eligible")}
                      disabled={processing === request.id}
                    >
                      <XCircle className="size-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(request.id)}
                      disabled={processing === request.id}
                    >
                      <CheckCircle className="size-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
