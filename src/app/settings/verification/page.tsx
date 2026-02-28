"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCheck, Building2, Landmark, CheckCircle, Clock, XCircle } from "lucide-react";
import { VerificationApplyModal } from "@/components/verification/VerificationApplyModal";

interface VerificationStatus {
  id: string;
  type: string;
  status: string;
  verifiedAt: string | null;
  expiresAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface UserStatus {
  verified: boolean;
  verifiedAt: string | null;
  verificationStatus: string;
}

export default function VerificationSettingsPage() {
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/verification/status");
        if (response.ok) {
          const data = await response.json();
          setVerification(data.verification);
          setUserStatus(data.userStatus);
        }
      } catch (error) {
        console.error("Failed to fetch verification status:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [modalOpen]);

  const getStatusIcon = () => {
    if (!verification) return null;

    switch (verification.status) {
      case "approved":
        return <CheckCircle className="size-8 text-green-500" />;
      case "pending":
        return <Clock className="size-8 text-yellow-500" />;
      case "rejected":
        return <XCircle className="size-8 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "blue":
        return <BadgeCheck className="size-6 text-[#1d9bf0]" />;
      case "gold":
        return <Building2 className="size-6 text-[#e2b719]" />;
      case "gray":
      case "government":
        return <Landmark className="size-6 text-[#8b98a5]" />;
      default:
        return <BadgeCheck className="size-6" />;
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Verification</h1>

      {verification && verification.status === "approved" ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              {getTypeIcon(verification.type)}
              <div>
                <CardTitle>Verified Account</CardTitle>
                <CardDescription>
                  Your account is verified with a {verification.type} checkmark
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Verified on</span>
                <span>
                  {verification.verifiedAt
                    ? new Date(verification.verifiedAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              {verification.expiresAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expires</span>
                  <span>{new Date(verification.expiresAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : verification && verification.status === "pending" ? (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Clock className="size-6 text-yellow-500" />
              <div>
                <CardTitle>Application Under Review</CardTitle>
                <CardDescription>
                  We're reviewing your {verification.type} verification application
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Submitted on {new Date(verification.createdAt).toLocaleDateString()}. We typically
              review applications within 2-3 business days.
            </p>
          </CardContent>
        </Card>
      ) : verification && verification.status === "rejected" ? (
        <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <div className="flex items-center gap-3">
              <XCircle className="size-6 text-red-500" />
              <div>
                <CardTitle>Application Rejected</CardTitle>
                <CardDescription>
                  Your {verification.type} verification was not approved
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {verification.rejectionReason && (
              <p className="text-sm text-gray-600 mb-4">
                <strong>Reason:</strong> {verification.rejectionReason}
              </p>
            )}
            <Button onClick={() => setModalOpen(true)}>Apply Again</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Verification Options */}
          <div className="grid gap-4 mb-6">
            {/* Blue Checkmark */}
            <Card className="cursor-pointer hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="size-8 text-[#1d9bf0]" />
                    <div>
                      <CardTitle className="text-lg">Verified Blue</CardTitle>
                      <CardDescription>For individuals</CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">$8</div>
                    <div className="text-sm text-gray-500">/month</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Blue checkmark next to your name</li>
                  <li>• Shows your account is authentic</li>
                  <li>• Priority support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Gold Checkmark */}
            <Card className="cursor-pointer hover:border-yellow-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="size-8 text-[#e2b719]" />
                    <div>
                      <CardTitle className="text-lg">Business Gold</CardTitle>
                      <CardDescription>For businesses & organizations</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Gold checkmark for your business</li>
                  <li>• Verified business status</li>
                  <li>• Enhanced profile features</li>
                </ul>
              </CardContent>
            </Card>

            {/* Government Checkmark */}
            <Card className="cursor-pointer hover:border-gray-400 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Landmark className="size-8 text-[#8b98a5]" />
                    <div>
                      <CardTitle className="text-lg">Government</CardTitle>
                      <CardDescription>For government & officials</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Gray checkmark for official accounts</li>
                  <li>• Verified government status</li>
                  <li>• Free for eligible agencies</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" onClick={() => setModalOpen(true)} className="w-full">
            Apply for Verification
          </Button>
        </>
      )}

      <VerificationApplyModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
