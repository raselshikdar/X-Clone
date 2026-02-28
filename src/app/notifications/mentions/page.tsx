"use client";

import * as React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NotificationTabs } from "@/components/notifications/NotificationTabs";
import { NotificationList } from "@/components/notifications/NotificationList";
import { useUnreadCount } from "@/components/notifications/NotificationBadge";

interface NotificationSettings {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  mentions: boolean;
  replies: boolean;
}

export default function MentionsPage() {
  const { unreadCount } = useUnreadCount();
  const [settings, setSettings] = React.useState<NotificationSettings>({
    notificationsEnabled: true,
    emailNotifications: true,
    mentions: true,
    replies: true,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch settings
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/notifications/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      console.error("Error updating setting:", error);
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !value }));
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header with tabs */}
      <NotificationTabs unreadCount={unreadCount} />

      {/* Settings button */}
      <div className="absolute top-3 right-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
            >
              <Settings className="size-5" />
              <span className="sr-only">Notification settings</span>
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[300px] sm:w-[350px]">
            <SheetHeader>
              <SheetTitle>Notification settings</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Main toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="text-base font-normal">
                  Notifications
                </Label>
                <Switch
                  id="notifications"
                  checked={settings.notificationsEnabled}
                  onCheckedChange={(checked) =>
                    updateSetting("notificationsEnabled", checked)
                  }
                  disabled={isLoading}
                />
              </div>

              <Separator />

              {/* Mention specific settings */}
              <div className="space-y-4">
                <h3 className="text-base font-bold">Mentions</h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[15px] font-normal">
                      @Mentions
                    </Label>
                    <Switch
                      checked={settings.mentions}
                      onCheckedChange={(checked) => updateSetting("mentions", checked)}
                      disabled={isLoading || !settings.notificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-[15px] font-normal">Replies</Label>
                    <Switch
                      checked={settings.replies}
                      onCheckedChange={(checked) => updateSetting("replies", checked)}
                      disabled={isLoading || !settings.notificationsEnabled}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Email notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email" className="text-base font-normal">
                    Email notifications
                  </Label>
                  <p className="text-sm text-twitter-secondary dark:text-twitter-secondary-dark">
                    Get notified via email
                  </p>
                </div>
                <Switch
                  id="email"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    updateSetting("emailNotifications", checked)
                  }
                  disabled={isLoading || !settings.notificationsEnabled}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Notification list - only mentions */}
      <NotificationList type="mentions" />
    </div>
  );
}
