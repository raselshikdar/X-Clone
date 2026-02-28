"use client";

import * as React from "react";
import { Smartphone, Monitor, Tablet, MapPin, MoreHorizontal, LogOut, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "next-auth/react";

interface Session {
  id: string;
  device: string;
  browser: string;
  os: string;
  location: string;
  lastActive: string;
  createdAt: string;
  isCurrent: boolean;
}

interface CurrentSession {
  device: string;
  browser: string;
  os: string;
  ipAddress: string;
}

interface SessionsListProps {
  currentSession?: CurrentSession;
  sessions?: Session[];
}

export function SessionsList({
  currentSession,
  sessions = [],
}: SessionsListProps) {
  const { toast } = useToast();
  const [showLogoutAll, setShowLogoutAll] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [localSessions, setLocalSessions] = React.useState(sessions);

  // Get device icon
  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case "mobile":
        return Smartphone;
      case "tablet":
        return Tablet;
      default:
        return Monitor;
    }
  };

  // Format relative time
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return lastActive.toLocaleDateString();
  };

  // Logout from specific session
  const handleLogoutSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/settings/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLocalSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast({
          title: "Session logged out",
          description: "The device has been logged out.",
        });
      } else {
        throw new Error("Failed to logout");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout from session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Logout from all other sessions
  const handleLogoutAll = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/settings/sessions", {
        method: "DELETE",
      });

      if (response.ok) {
        setLocalSessions((prev) => prev.filter((s) => s.isCurrent));
        toast({
          title: "Logged out from other devices",
          description: "All other devices have been logged out.",
        });
      } else {
        throw new Error("Failed to logout");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout from other devices. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoggingOut(false);
      setShowLogoutAll(false);
    }
  };

  const DeviceIcon = currentSession ? getDeviceIcon(currentSession.device) : Monitor;

  return (
    <div className="divide-y divide-twitter-border dark:divide-twitter-border-dark">
      {/* Current Session */}
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Current session</h2>
        <div className="flex items-start gap-4 p-4 bg-twitter-gray/10 dark:bg-twitter-gray-dark/10 rounded-lg">
          <div className="p-3 bg-twitter-blue/10 rounded-lg">
            <DeviceIcon className="size-6 text-twitter-blue" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{currentSession?.device || "Desktop"}</p>
              <span className="text-xs bg-twitter-blue text-white px-2 py-0.5 rounded-full">
                Active now
              </span>
            </div>
            <p className="text-sm text-twitter-secondary mt-1">
              {currentSession?.browser || "Unknown browser"} on {currentSession?.os || "Unknown OS"}
            </p>
            <p className="text-xs text-twitter-secondary mt-1 flex items-center gap-1">
              <MapPin className="size-3" />
              IP: {currentSession?.ipAddress || "Unknown"}
            </p>
          </div>
        </div>
      </div>

      {/* Other Sessions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Other sessions</h2>
          {localSessions.some((s) => !s.isCurrent) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
              onClick={() => setShowLogoutAll(true)}
            >
              Log out all other sessions
            </Button>
          )}
        </div>

        {localSessions.length === 0 ? (
          <div className="p-8 text-center">
            <Monitor className="size-12 mx-auto text-twitter-secondary mb-3" />
            <p className="font-semibold text-lg">No other sessions</p>
            <p className="text-twitter-secondary text-sm mt-1">
              You're only logged in on this device.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {localSessions
              .filter((s) => !s.isCurrent)
              .map((session) => {
                const SessionIcon = getDeviceIcon(session.device);
                return (
                  <div
                    key={session.id}
                    className="flex items-start gap-4 p-4 border border-twitter-border dark:border-twitter-border-dark rounded-lg"
                  >
                    <div className="p-2 bg-twitter-gray/20 dark:bg-twitter-gray-dark/20 rounded-lg">
                      <SessionIcon className="size-5 text-twitter-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{session.device}</p>
                      <p className="text-sm text-twitter-secondary">
                        {session.browser} on {session.os}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-twitter-secondary">
                        <MapPin className="size-3" />
                        {session.location}
                        <span className="text-twitter-border dark:text-twitter-border-dark">•</span>
                        {formatRelativeTime(session.lastActive)}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-red-500"
                          onClick={() => handleLogoutSession(session.id)}
                        >
                          <LogOut className="size-4 mr-2" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="p-4">
        <div className="flex gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
          <AlertTriangle className="size-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-700 dark:text-yellow-500">
              Security tip
            </p>
            <p className="text-yellow-600 dark:text-yellow-400 mt-1">
              If you see any sessions you don't recognize, log out of them immediately and change your password.
            </p>
          </div>
        </div>
      </div>

      {/* Logout All Confirmation */}
      <AlertDialog open={showLogoutAll} onOpenChange={setShowLogoutAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out all other sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will log you out on all other devices. You'll need to log in again on those devices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutAll}
              disabled={loggingOut}
              className="bg-red-500 hover:bg-red-600"
            >
              {loggingOut ? "Logging out..." : "Log out all other sessions"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
