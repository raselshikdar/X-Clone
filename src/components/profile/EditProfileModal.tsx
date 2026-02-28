"use client";

import * as React from "react";
import { Camera, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useUserStore, UserProfile } from "@/stores/userStore";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserProfile;
  onSuccess?: () => void;
}

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onSuccess,
}: EditProfileModalProps) {
  const { updateProfile } = useUserStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    displayName: profile.displayName || "",
    bio: profile.bio || "",
    location: profile.location || "",
    website: profile.website || "",
    birthDate: profile.birthDate
      ? new Date(profile.birthDate).toISOString().split("T")[0]
      : "",
    isPrivate: profile.isPrivate,
  });
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(
    profile.avatar
  );
  const [bannerPreview, setBannerPreview] = React.useState<string | null>(
    profile.banner
  );
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [bannerFile, setBannerFile] = React.useState<File | null>(null);

  // Reset form when profile changes
  React.useEffect(() => {
    setFormData({
      displayName: profile.displayName || "",
      bio: profile.bio || "",
      location: profile.location || "",
      website: profile.website || "",
      birthDate: profile.birthDate
        ? new Date(profile.birthDate).toISOString().split("T")[0]
        : "",
      isPrivate: profile.isPrivate,
    });
    setAvatarPreview(profile.avatar);
    setBannerPreview(profile.banner);
    setAvatarFile(null);
    setBannerFile(null);
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Upload avatar if changed
      if (avatarFile) {
        const avatarFormData = new FormData();
        avatarFormData.append("avatar", avatarFile);
        await fetch("/api/users/me/avatar", {
          method: "POST",
          body: avatarFormData,
        });
      }

      // Upload banner if changed
      if (bannerFile) {
        const bannerFormData = new FormData();
        bannerFormData.append("banner", bannerFile);
        await fetch("/api/users/me/banner", {
          method: "POST",
          body: bannerFormData,
        });
      }

      // Update profile data
      await updateProfile({
        displayName: formData.displayName || null,
        bio: formData.bio || null,
        location: formData.location || null,
        website: formData.website || null,
        birthDate: formData.birthDate ? new Date(formData.birthDate) : null,
        isPrivate: formData.isPrivate,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center gap-6 p-4 border-b border-twitter-border dark:border-twitter-border-dark sticky top-0 bg-white dark:bg-black z-10">
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
          >
            <X className="size-5" />
          </button>
          <DialogTitle className="text-xl font-bold">Edit profile</DialogTitle>
          <div className="ml-auto">
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="rounded-full bg-black dark:bg-white text-white dark:text-black font-bold min-w-[80px] h-8"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogHeader>

        {/* Banner */}
        <div className="relative h-[200px] bg-gray-200 dark:bg-gray-800">
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-twitter-gray dark:bg-twitter-gray-dark" />
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
              />
              <div className="p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
                <Camera className="size-5 text-white" />
              </div>
            </label>
          </div>
        </div>

        {/* Avatar */}
        <div className="relative -mt-12 mx-4 mb-3">
          <div className="relative inline-block">
            <div className="size-24 rounded-full overflow-hidden ring-4 ring-white dark:ring-black bg-gray-200 dark:bg-gray-700">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-gray-500">
                  {(formData.displayName || profile.username)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors">
                <Camera className="size-4 text-white" />
              </div>
            </label>
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-4 space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-twitter-secondary">
              Name
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              placeholder="Name"
              maxLength={50}
              className="border-twitter-border dark:border-twitter-border-dark focus:border-twitter-blue focus:ring-twitter-blue"
            />
            <p className="text-xs text-twitter-secondary text-right">
              {formData.displayName.length}/50
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-twitter-secondary">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              placeholder="Bio"
              maxLength={160}
              rows={3}
              className="border-twitter-border dark:border-twitter-border-dark focus:border-twitter-blue focus:ring-twitter-blue resize-none"
            />
            <p className="text-xs text-twitter-secondary text-right">
              {formData.bio.length}/160
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-twitter-secondary">
              Location
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Location"
              maxLength={30}
              className="border-twitter-border dark:border-twitter-border-dark focus:border-twitter-blue focus:ring-twitter-blue"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="text-twitter-secondary">
              Website
            </Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="Website"
              className="border-twitter-border dark:border-twitter-border-dark focus:border-twitter-blue focus:ring-twitter-blue"
            />
          </div>

          {/* Birth Date */}
          <div className="space-y-2">
            <Label htmlFor="birthDate" className="text-twitter-secondary">
              Birth date
            </Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
              className="border-twitter-border dark:border-twitter-border-dark focus:border-twitter-blue focus:ring-twitter-blue"
            />
          </div>

          {/* Private Account Toggle */}
          <div className="flex items-center justify-between py-4 border-t border-twitter-border dark:border-twitter-border-dark">
            <div>
              <p className="font-bold">Private account</p>
              <p className="text-sm text-twitter-secondary">
                When your account is private, only people you approve can see
                your tweets and followers. Anyone can send you a follow
                request.
              </p>
            </div>
            <Switch
              checked={formData.isPrivate}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isPrivate: checked })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
