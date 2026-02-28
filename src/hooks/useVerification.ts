import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { VerificationType } from "@/components/verification/VerifiedBadge";

interface VerificationStatus {
  verificationStatus: string;
  verified: boolean;
  verifiedAt: string | null;
  verification: {
    id: string;
    type: VerificationType;
    status: string;
    verifiedAt: string | null;
    expiresAt: string | null;
    businessName?: string;
    businessWebsite?: string;
    officialEmail?: string;
    agencyName?: string;
    rejectionReason?: string;
    createdAt: string;
  } | null;
}

interface ApplyVerificationData {
  type: VerificationType;
  businessName?: string;
  businessWebsite?: string;
  businessCategory?: string;
  documentsUrl?: string;
  officialEmail?: string;
  agencyName?: string;
}

export function useVerification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get verification status
  const statusQuery = useQuery<VerificationStatus>({
    queryKey: ["verification-status"],
    queryFn: async () => {
      const res = await fetch("/api/verification/status");
      if (!res.ok) throw new Error("Failed to fetch verification status");
      return res.json();
    },
  });

  // Apply for verification
  const applyMutation = useMutation({
    mutationFn: async (data: ApplyVerificationData) => {
      const res = await fetch("/api/verification/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to apply for verification");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      toast({
        title: data.verification?.status === "approved" ? "Verified!" : "Application Submitted",
        description: data.message,
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

  // Cancel pending verification
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to cancel verification");
      }
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

  // Renew blue subscription
  const renewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings/verification", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "renew" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to renew subscription");
      }
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

  return {
    // Status
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    error: statusQuery.error,
    refetchStatus: statusQuery.refetch,

    // Computed
    isVerified: statusQuery.data?.verified ?? false,
    verificationType: statusQuery.data?.verification?.type ?? null,
    verificationStatus: statusQuery.data?.verificationStatus ?? "none",
    hasPendingRequest: statusQuery.data?.verificationStatus === "pending",
    isRejected: statusQuery.data?.verificationStatus === "rejected",

    // Actions
    applyForVerification: applyMutation.mutate,
    isApplying: applyMutation.isPending,
    cancelVerification: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
    renewSubscription: renewMutation.mutate,
    isRenewing: renewMutation.isPending,
  };
}

// Hook for admin functions
export function useVerificationAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get pending verification requests
  const pendingQuery = useQuery({
    queryKey: ["pending-verifications"],
    queryFn: async () => {
      const res = await fetch("/api/verification/admin/pending");
      if (!res.ok) throw new Error("Failed to fetch pending requests");
      return res.json();
    },
  });

  // Approve verification
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await fetch(`/api/verification/admin/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to approve verification");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] });
      toast({
        title: "Approved",
        description: "Verification request has been approved",
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

  // Reject verification
  const rejectMutation = useMutation({
    mutationFn: async ({
      id,
      rejectionReason,
      notes,
    }: {
      id: string;
      rejectionReason?: string;
      notes?: string;
    }) => {
      const res = await fetch(`/api/verification/admin/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason, notes }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to reject verification");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] });
      toast({
        title: "Rejected",
        description: "Verification request has been rejected",
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

  return {
    // Pending requests
    pendingRequests: pendingQuery.data?.verifications ?? [],
    pagination: pendingQuery.data?.pagination,
    isLoading: pendingQuery.isLoading,
    error: pendingQuery.error,
    refetch: pendingQuery.refetch,

    // Actions
    approve: approveMutation.mutate,
    isApproving: approveMutation.isPending,
    reject: rejectMutation.mutate,
    isRejecting: rejectMutation.isPending,
  };
}

export default useVerification;
