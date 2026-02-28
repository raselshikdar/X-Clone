"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  Check,
  X,
  ExternalLink,
  Loader2,
  Filter,
  Search,
  Building2,
  Landmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/common/Avatar";
import { useToast } from "@/hooks/use-toast";
import { VerifiedBadge, VerificationType } from "./VerifiedBadge";

interface VerificationRequest {
  id: string;
  type: VerificationType;
  status: string;
  createdAt: string;
  businessName?: string;
  businessWebsite?: string;
  businessCategory?: string;
  documentsUrl?: string;
  officialEmail?: string;
  agencyName?: string;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    email: string;
    avatar: string | null;
    bio: string | null;
    location: string | null;
    website: string | null;
    createdAt: string;
  };
}

interface PendingResponse {
  verifications: VerificationRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function VerificationAdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRequest, setSelectedRequest] = React.useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [showRejectDialog, setShowRejectDialog] = React.useState(false);

  // Fetch pending verification requests
  const { data, isLoading, error, refetch } = useQuery<PendingResponse>({
    queryKey: ["pending-verifications", typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      const res = await fetch(`/api/verification/admin/pending?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch pending requests");
      return res.json();
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/verification/admin/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: "" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] });
      toast({
        title: "Approved",
        description: "Verification request has been approved",
      });
      setSelectedRequest(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (data: { id: string; reason: string }) => {
      const res = await fetch(`/api/verification/admin/${data.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejectionReason: data.reason }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-verifications"] });
      toast({
        title: "Rejected",
        description: "Verification request has been rejected",
      });
      setShowRejectDialog(false);
      setSelectedRequest(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: VerificationRequest) => {
    approveMutation.mutate(request.id);
  };

  const handleReject = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (selectedRequest) {
      rejectMutation.mutate({
        id: selectedRequest.id,
        reason: rejectionReason,
      });
    }
  };

  const verifications = data?.verifications ?? [];
  
  const filteredRequests = React.useMemo(() => {
    if (!verifications.length) return [];
    if (!searchQuery) return verifications;
    
    const query = searchQuery.toLowerCase();
    return verifications.filter(
      (v) =>
        v.user.username.toLowerCase().includes(query) ||
        v.user.displayName?.toLowerCase().includes(query) ||
        v.user.email.toLowerCase().includes(query) ||
        v.businessName?.toLowerCase().includes(query) ||
        v.agencyName?.toLowerCase().includes(query)
    );
  }, [verifications, searchQuery]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-twitter-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load verification requests</p>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-twitter-secondary" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="size-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="gold">Gold (Business)</SelectItem>
            <SelectItem value="government">Government</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{data?.pagination.total || 0}</div>
            <div className="text-sm text-twitter-secondary">Pending Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-yellow-500" />
              <span className="text-2xl font-bold">
                {filteredRequests.filter((v) => v.type === "gold").length}
              </span>
            </div>
            <div className="text-sm text-twitter-secondary">Business</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Landmark className="size-5 text-gray-500" />
              <span className="text-2xl font-bold">
                {filteredRequests.filter((v) => v.type === "government").length}
              </span>
            </div>
            <div className="text-sm text-twitter-secondary">Government</div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-twitter-secondary">
              <BadgeCheck className="size-12 mx-auto mb-4 opacity-50" />
              <p>No pending verification requests</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-start gap-4 p-4">
                  {/* User info */}
                  <UserAvatar
                    src={request.user.avatar}
                    alt={request.user.displayName || request.user.username}
                    fallback={request.user.displayName || request.user.username}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold truncate">
                        {request.user.displayName || request.user.username}
                      </span>
                      <VerifiedBadge type={request.type} size="sm" />
                      <Badge variant="outline" className="capitalize">
                        {request.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-twitter-secondary">
                      @{request.user.username} · {request.user.email}
                    </p>
                    {request.user.bio && (
                      <p className="text-sm mt-2 line-clamp-2">{request.user.bio}</p>
                    )}

                    {/* Type-specific info */}
                    {request.type === "gold" && (
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Business:</span>{" "}
                          {request.businessName}
                        </p>
                        {request.businessWebsite && (
                          <p className="text-sm">
                            <span className="font-medium">Website:</span>{" "}
                            <a
                              href={request.businessWebsite}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-twitter-blue hover:underline inline-flex items-center gap-1"
                            >
                              {request.businessWebsite}
                              <ExternalLink className="size-3" />
                            </a>
                          </p>
                        )}
                        {request.businessCategory && (
                          <p className="text-sm">
                            <span className="font-medium">Category:</span>{" "}
                            {request.businessCategory}
                          </p>
                        )}
                      </div>
                    )}

                    {request.type === "government" && (
                      <div className="mt-3 p-3 bg-gray-500/10 rounded-lg space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Agency:</span> {request.agencyName}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Official Email:</span>{" "}
                          {request.officialEmail}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-twitter-secondary mt-2">
                      Submitted on {formatDate(request.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-500 hover:bg-green-500/10"
                      onClick={() => handleApprove(request)}
                      disabled={approveMutation.isPending}
                    >
                      {approveMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:bg-red-500/10"
                      onClick={() => handleReject(request)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this verification request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter the reason for rejection..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VerificationAdminPanel;
