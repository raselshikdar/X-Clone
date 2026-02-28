"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Flag,
  MoreHorizontal,
  CheckCircle,
  AlertTriangle,
  Ban,
  Eye,
  Clock,
  User,
  FileText,
  Building2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  type: string;
  reportedId: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: string;
  reporter: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  reportedUser: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
    verified: boolean;
  } | null;
  reviewer: {
    id: string;
    username: string;
    displayName: string;
  } | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionModal, setActionModal] = useState<{ open: boolean; report: Report | null }>({
    open: false,
    report: null,
  });
  const [action, setAction] = useState<string>("");
  const [actionReason, setActionReason] = useState("");
  const [actionDuration, setActionDuration] = useState(7);
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);

      const response = await fetch(`/api/admin/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, typeFilter]);

  const handleAction = async () => {
    if (!actionModal.report) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/reports/${actionModal.report.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reason: actionReason,
          durationDays: actionDuration,
        }),
      });

      if (response.ok) {
        toast({ title: "Action taken", description: `Report has been ${action}ed.` });
        fetchReports();
        setActionModal({ open: false, report: null });
        setAction("");
        setActionReason("");
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process action",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "tweet":
        return <FileText className="size-4" />;
      case "user":
        return <User className="size-4" />;
      case "community":
        return <Building2 className="size-4" />;
      case "message":
        return <MessageSquare className="size-4" />;
      default:
        return <Flag className="size-4" />;
    }
  };

  return (
    <AdminLayout activeTab="reports">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Reports</h1>
            <p className="text-gray-500">Review and moderate reported content</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="tweet">Tweets</SelectItem>
              <SelectItem value="user">Users</SelectItem>
              <SelectItem value="community">Communities</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4" />
              </div>
            ))
          ) : reports.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center">
              <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No reports</h3>
              <p className="text-gray-500">No reports match your filters.</p>
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="gap-1">
                        {getTypeIcon(report.type)}
                        {report.type}
                      </Badge>
                      <Badge
                        variant={
                          report.status === "pending"
                            ? "default"
                            : report.status === "resolved"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {report.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="font-medium mb-1">
                      <strong>Reason:</strong> {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Reported by:</span>{" "}
                        <Link
                          href={`/${report.reporter.username}`}
                          className="text-blue-500 hover:underline"
                        >
                          @{report.reporter.username}
                        </Link>
                      </div>
                      {report.reportedUser && (
                        <div>
                          <span className="text-gray-500">Reported user:</span>{" "}
                          <Link
                            href={`/${report.reportedUser.username}`}
                            className="text-blue-500 hover:underline"
                          >
                            @{report.reportedUser.username}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {report.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => setActionModal({ open: true, report })}
                    >
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Modal */}
      <Dialog
        open={actionModal.open}
        onOpenChange={(open) => setActionModal({ open, report: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Take Action</DialogTitle>
            <DialogDescription>
              Choose an action for this report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Action</Label>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="suspension">
                    <div className="flex items-center gap-2">
                      <Clock className="size-4" />
                      Suspend User
                    </div>
                  </SelectItem>
                  <SelectItem value="ban">
                    <div className="flex items-center gap-2">
                      <Ban className="size-4" />
                      Ban Permanently
                    </div>
                  </SelectItem>
                  <SelectItem value="dismiss">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="size-4" />
                      Dismiss Report
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {action === "suspension" && (
              <div>
                <Label>Duration (days)</Label>
                <Select value={actionDuration.toString()} onValueChange={(v) => setActionDuration(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Notes</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setActionModal({ open: false, report: null })}>
                Cancel
              </Button>
              <Button onClick={handleAction} disabled={!action || processing}>
                {processing ? "Processing..." : "Confirm Action"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
