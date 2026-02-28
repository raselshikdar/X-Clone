"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AtSign,
  Mail,
  Phone,
  Key,
  AlertTriangle,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { DeactivateModal } from "./DeactivateModal";

interface AccountSettingsProps {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
    phone: string | null;
    createdAt: string;
  } | null;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  // Edit states
  const [editingField, setEditingField] = React.useState<string | null>(null);
  const [username, setUsername] = React.useState(user?.username || "");
  const [email, setEmail] = React.useState(user?.email || "");
  const [phone, setPhone] = React.useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Modal states
  const [showDeactivateModal, setShowDeactivateModal] = React.useState(false);

  // Check username availability
  const checkUsername = async (value: string) => {
    if (value === user?.username) return true;
    try {
      const response = await fetch(`/api/auth/check-username?username=${value}`);
      const data = await response.json();
      return data.available;
    } catch {
      return false;
    }
  };

  // Check email availability
  const checkEmail = async (value: string) => {
    if (value === user?.email) return true;
    try {
      const response = await fetch(`/api/auth/check-email?email=${value}`);
      const data = await response.json();
      return data.available;
    } catch {
      return false;
    }
  };

  // Handle field update
  const handleUpdate = async (field: string, value: string) => {
    setIsLoading(true);
    try {
      // Validate unique fields
      if (field === "username") {
        const available = await checkUsername(value);
        if (!available) {
          toast({
            title: "Username taken",
            description: "Please choose another username.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      if (field === "email") {
        const available = await checkEmail(value);
        if (!available) {
          toast({
            title: "Email in use",
            description: "This email is already associated with an account.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update");
      }

      toast({
        title: "Updated",
        description: `Your ${field} has been updated.`,
      });

      setEditingField(null);
      router.refresh();
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

  // Handle password change
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });

      setEditingField(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
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

  // Settings items
  const settingsItems = [
    {
      id: "username",
      icon: AtSign,
      label: "Username",
      value: user?.username,
      description: "Your unique identifier on X",
    },
    {
      id: "email",
      icon: Mail,
      label: "Email",
      value: user?.email,
      description: "Used for account notifications and recovery",
    },
    {
      id: "phone",
      icon: Phone,
      label: "Phone",
      value: user?.phone || "Not set",
      description: "Add a phone number for additional security",
    },
  ];

  return (
    <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
      {/* Account Information */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Account information</h2>
        <div className="space-y-0 divide-y divide-twitter-border dark:divide-twitter-border-dark">
          {settingsItems.map((item) => (
            <div key={item.id} className="py-4 first:pt-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon className="size-5 text-twitter-secondary" />
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-twitter-secondary">{item.value}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-twitter-blue hover:text-twitter-blue hover:bg-twitter-blue/10"
                  onClick={() => setEditingField(item.id)}
                >
                  Change
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Password */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Change your password</h2>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Key className="size-5 text-twitter-secondary" />
            <div>
              <p className="font-semibold">Password</p>
              <p className="text-sm text-twitter-secondary">
                ••••••••••••••••
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-twitter-blue hover:text-twitter-blue hover:bg-twitter-blue/10"
            onClick={() => setEditingField("password")}
          >
            Change
          </Button>
        </div>
      </div>

      {/* Download Data */}
      <div className="p-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <Download className="size-5 text-twitter-secondary" />
            <div>
              <p className="font-semibold">Download an archive of your data</p>
              <p className="text-sm text-twitter-secondary">
                Get insights into the data associated with your X account
              </p>
            </div>
          </div>
          <ArrowRight className="size-5 text-twitter-secondary" />
        </div>
      </div>

      {/* Deactivate */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4 text-red-500">Deactivate your account</h2>
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-red-500" />
            <div>
              <p className="font-semibold">Deactivate account</p>
              <p className="text-sm text-twitter-secondary">
                Find out how you can deactivate your account
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
            onClick={() => setShowDeactivateModal(true)}
          >
            Deactivate
          </Button>
        </div>
      </div>

      {/* Edit Username Dialog */}
      <Dialog open={editingField === "username"} onOpenChange={() => setEditingField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change username</DialogTitle>
            <DialogDescription>
              Your username is your unique identifier on X.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-twitter-secondary">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  className="pl-8"
                  placeholder="username"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingField(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdate("username", username)}
              disabled={isLoading || !username || username === user?.username}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Email Dialog */}
      <Dialog open={editingField === "email"} onOpenChange={() => setEditingField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change email</DialogTitle>
            <DialogDescription>
              Your email is used for account notifications and recovery.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingField(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdate("email", email)}
              disabled={isLoading || !email || email === user?.email}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phone Dialog */}
      <Dialog open={editingField === "phone"} onOpenChange={() => setEditingField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add phone number</DialogTitle>
            <DialogDescription>
              Add a phone number for additional account security.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingField(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleUpdate("phone", phone)}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={editingField === "password"} onOpenChange={() => setEditingField(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingField(null)}>
              Cancel
            </Button>
            <Button
              onClick={handlePasswordChange}
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Modal */}
      <DeactivateModal
        open={showDeactivateModal}
        onOpenChange={setShowDeactivateModal}
      />
    </div>
  );
}
