"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Calendar,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { VerifiedBadge, VerificationType } from "./VerifiedBadge";

interface VerificationStatusData {
  verificationStatus: string;
  verified: boolean;
  verifiedAt: string | null;
  verification: {
    id: string;
    type: VerificationType;
    status: string;
    verifiedAt: string | null;
    expiresAt: string | null;
    rejectionReason?: string;
    createdAt: string;
  } | null;
}

export function VerificationStatus() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<VerificationStatusData>({
    queryKey: ["verification-status"],
    queryFn: async () => {
      const res = await fetch("/api/verification/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) throw new Error("Failed to cancel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      toast({
        title: "Cancelled",
        description: "Your verification request has been cancelled",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const renewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renew" }),
      });
      if (!res.ok) throw new Error("Failed to renew");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      toast({
        title: "Renewed",
        description: "Your Blue subscription has been renewed for 30 days",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="size-6 animate-spin text-twitter-blue" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-twitter-secondary">
          <AlertCircle className="size-6 mx-auto mb-2" />
          <p>Unable to load verification status</p>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Not verified and no application
  if (data.verificationStatus === "none" || !data.verification) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BadgeCheck className="size-5" />
            Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-twitter-secondary mb-4">
            You are not verified. Apply for verification to get a checkmark badge.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Pending verification
  if (data.verificationStatus === "pending" || data.verification.status === "pending") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="size-5 text-yellow-500" />
            Verification Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <VerifiedBadge
              type={data.verification.type}
              size="lg"
              showTooltip={false}
            />
            <div>
              <p className="font-medium capitalize">{data.verification.type} Verification</p>
              <p className="text-sm text-twitter-secondary">
                Submitted on {formatDate(data.verification.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-twitter-secondary">
            <Loader2 className="size-4 animate-spin" />
            Your application is being reviewed
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <X className="size-4 mr-2" />
            )}
            Cancel Request
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Approved/Verified
  if (data.verified && data.verification.status === "approved") {
    const daysRemaining = getDaysRemaining(data.verification.expiresAt);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <VerifiedBadge type={data.verification.type} showTooltip={false} />
            Verified Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <VerifiedBadge
              type={data.verification.type}
              size="lg"
              showTooltip={false}
            />
            <div>
              <p className="font-medium capitalize">{data.verification.type} Verification</p>
              <p className="text-sm text-twitter-secondary">
                Verified on {formatDate(data.verification.verifiedAt)}
              </p>
            </div>
          </div>

          {data.verification.type === "blue" && data.verification.expiresAt && (
            <div className="p-3 bg-twitter-blue/10 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-twitter-blue" />
                  <span className="text-sm">
                    {daysRemaining !== null && daysRemaining > 0
                      ? `${daysRemaining} days remaining`
                      : "Expired"}
                  </span>
                </div>
                {daysRemaining !== null && daysRemaining <= 7 && (
                  <Button
                    size="sm"
                    onClick={() => renewMutation.mutate()}
                    disabled={renewMutation.isPending}
                  >
                    {renewMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="size-4 mr-1" />
                    )}
                    Renew
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Rejected
  if (data.verificationStatus === "rejected" || data.verification.status === "rejected") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-red-500">
            <X className="size-5" />
            Verification Rejected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-red-500/10 rounded-lg">
            <p className="text-sm">
              {data.verification.rejectionReason || "Your verification request was rejected."}
            </p>
          </div>
          <p className="text-sm text-twitter-secondary">
            You may submit a new application after addressing the issues mentioned above.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}

export default VerificationStatus;
