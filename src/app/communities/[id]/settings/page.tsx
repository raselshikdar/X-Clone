"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Lock,
  Globe,
  Trash2,
  Save,
  Plus,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommunitySettings {
  id: string;
  name: string;
  description: string | null;
  banner: string | null;
  icon: string | null;
  isPrivate: boolean;
  rules: string[];
  owner: {
    id: string;
    username: string;
  };
  isOwner: boolean;
}

export default function CommunitySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<CommunitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");
  const [banner, setBanner] = useState<string | null>(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCommunity();
  }, [communityId]);

  const fetchCommunity = async () => {
    try {
      const response = await fetch(`/api/communities/${communityId}`);
      if (response.ok) {
        const data = await response.json();
        setCommunity(data.community);
        setName(data.community.name);
        setDescription(data.community.description || "");
        setIsPrivate(data.community.isPrivate);
        setRules(data.community.rules || []);
        setBanner(data.community.banner);

        // Redirect if not admin
        if (data.community.role !== "owner" && data.community.role !== "admin") {
          router.push(`/communities/${communityId}`);
        }
      } else if (response.status === 404) {
        router.push("/communities");
      }
    } catch (error) {
      console.error("Error fetching community:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setBanner(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddRule = () => {
    if (newRule.trim() && rules.length < 10) {
      setRules([...rules, newRule.trim()]);
      setNewRule("");
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Community name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          isPrivate,
          rules,
          banner,
        }),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
        fetchCommunity();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!community?.isOwner) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/communities/${communityId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Community deleted");
        router.push("/communities");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete community");
      }
    } catch (error) {
      toast.error("Failed to delete community");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-24 w-full mb-4" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-[600px] mx-auto p-4 text-center">
        Community not found
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto">
      {/* Back button */}
      <div className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-20 px-4 py-2 flex items-center justify-between border-b border-twitter-border dark:border-twitter-border-dark">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-twitter-hover dark:hover:bg-twitter-hover-dark"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="font-bold text-lg">Edit Community</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="rounded-full bg-twitter-blue hover:bg-twitter-blue/90"
        >
          {saving ? (
            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="size-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>

      <div className="p-4 space-y-6">
        {/* Banner */}
        <div>
          <Label className="mb-2 block">Banner Image</Label>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />
          <div
            onClick={() => bannerInputRef.current?.click()}
            className={cn(
              "h-32 rounded-xl border border-dashed border-twitter-border dark:border-twitter-border-dark",
              "flex items-center justify-center cursor-pointer overflow-hidden",
              "hover:border-twitter-blue transition-colors"
            )}
          >
            {banner ? (
              <img
                src={banner}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-twitter-secondary dark:text-twitter-secondary-dark">
                <ImageIcon className="size-8 mx-auto mb-2" />
                <span className="text-sm">Click to upload banner</span>
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <Label htmlFor="name">Community Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="mt-2"
          />
          <p className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark mt-1">
            {name.length}/50 characters
          </p>
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
            rows={3}
            className="mt-2 resize-none"
          />
          <p className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark mt-1">
            {description.length}/200 characters
          </p>
        </div>

        {/* Privacy */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-twitter-hover dark:bg-twitter-hover-dark">
          <div className="flex items-center gap-3">
            {isPrivate ? (
              <Lock className="size-5 text-twitter-secondary" />
            ) : (
              <Globe className="size-5 text-twitter-secondary" />
            )}
            <div>
              <div className="font-medium text-[15px]">
                {isPrivate ? "Private community" : "Public community"}
              </div>
              <div className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark">
                {isPrivate
                  ? "Only members can see posts"
                  : "Anyone can see and join"}
              </div>
            </div>
          </div>
          <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
        </div>

        {/* Rules */}
        <div>
          <Label>Community Rules</Label>
          <div className="mt-2 space-y-2">
            {rules.map((rule, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg bg-twitter-hover dark:bg-twitter-hover-dark"
              >
                <span className="text-[13px] text-twitter-secondary dark:text-twitter-secondary-dark font-bold">
                  {index + 1}.
                </span>
                <span className="flex-1 text-[14px] truncate">{rule}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRule(index)}
                  className="p-1 rounded-full hover:bg-twitter-blue/10 hover:text-twitter-blue"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
            {rules.length < 10 && (
              <div className="flex items-center gap-2">
                <Input
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Add a rule..."
                  maxLength={200}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddRule();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddRule}
                  disabled={!newRule.trim()}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Danger zone - Owner only */}
        {community.isOwner && (
          <div className="pt-6 border-t border-twitter-border dark:border-twitter-border-dark">
            <h3 className="font-bold text-red-500 mb-3">Danger Zone</h3>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-500 border-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="size-4 mr-2" />
              Delete Community
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Community?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              community &quot;{community.name}&quot; and all its content.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleting ? (
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
