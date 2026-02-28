"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";

interface DeactivateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeactivateModal({ open, onOpenChange }: DeactivateModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleDeactivate = async () => {
    if (!password || !confirmed) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: password,
          deactivate: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to deactivate account");
      }

      // Sign out the user
      await signOut({ redirect: false });

      toast({
        title: "Account deactivated",
        description: "Your account has been deactivated successfully.",
      });

      router.push("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center gap-6 p-4 border-b border-twitter-border dark:border-twitter-border-dark">
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
          >
            <X className="size-5" />
          </button>
          <DialogTitle className="text-xl font-bold">Deactivate account</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
            <AlertTriangle className="size-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-bold text-red-500">This will deactivate your account</p>
              <p className="text-sm text-red-600 dark:text-red-400">
                You're about to start the process of deactivating your X account. Your display name, @username, and public profile will no longer be viewable on X.com, X for iOS, or X for Android.
              </p>
            </div>
          </div>

          {/* What happens */}
          <div className="space-y-3 text-sm">
            <p className="font-semibold">Before you do this, please note:</p>
            <ul className="list-disc list-inside space-y-2 text-twitter-secondary">
              <li>Deactivating your account does not remove your account information from search engines like Google or Bing.</li>
              <li>You'll lose access to your account and all your data will be permanently deleted.</li>
              <li>Your username will become available for others to use.</li>
            </ul>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-twitter-secondary">
              Please enter your password to confirm
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>

          {/* Confirmation */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked as boolean)}
            />
            <label htmlFor="confirm" className="text-sm cursor-pointer">
              I understand that deactivating my account will permanently delete all my data and cannot be undone.
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-twitter-border dark:border-twitter-border-dark flex justify-end">
          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={isLoading || !password || !confirmed}
            className="bg-red-500 hover:bg-red-600"
          >
            {isLoading ? "Deactivating..." : "Deactivate"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
