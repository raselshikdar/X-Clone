"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BadgeCheck, Building2, Landmark, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationApplyModalProps {
  open: boolean;
  onClose: () => void;
}

export function VerificationApplyModal({ open, onClose }: VerificationApplyModalProps) {
  const [type, setType] = useState<"blue" | "gold" | "government">("blue");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Blue form state
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Gold form state
  const [businessName, setBusinessName] = useState("");
  const [businessWebsite, setBusinessWebsite] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");

  // Government form state
  const [agencyName, setAgencyName] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = { type };

      if (type === "gold") {
        body.businessName = businessName;
        body.businessWebsite = businessWebsite;
        body.businessCategory = businessCategory;
      } else if (type === "government") {
        body.agencyName = agencyName;
        body.officialEmail = officialEmail;
      }

      const response = await fetch("/api/verification/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply");
      }

      setSuccess(true);
      toast({
        title: type === "blue" ? "Verified!" : "Application submitted",
        description:
          type === "blue"
            ? "Your account is now verified!"
            : "Your application is being reviewed.",
      });

      setTimeout(() => {
        onClose();
        router.refresh();
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Get Verified</DialogTitle>
          <DialogDescription>
            Choose your verification type and submit your application.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="size-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {type === "blue" ? "You're Verified!" : "Application Submitted!"}
            </h3>
            <p className="text-gray-500 text-center">
              {type === "blue"
                ? "Your account is now verified with a blue checkmark."
                : "We'll review your application and get back to you soon."}
            </p>
          </div>
        ) : (
          <Tabs value={type} onValueChange={(v) => setType(v as typeof type)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="blue" className="flex items-center gap-1">
                <BadgeCheck className="size-4 text-[#1d9bf0]" />
                <span className="hidden sm:inline">Blue</span>
              </TabsTrigger>
              <TabsTrigger value="gold" className="flex items-center gap-1">
                <Building2 className="size-4 text-[#e2b719]" />
                <span className="hidden sm:inline">Business</span>
              </TabsTrigger>
              <TabsTrigger value="government" className="flex items-center gap-1">
                <Landmark className="size-4 text-[#8b98a5]" />
                <span className="hidden sm:inline">Gov</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="blue" className="space-y-4 mt-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <BadgeCheck className="size-5 text-[#1d9bf0]" />
                  Verified Blue
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Get the blue checkmark next to your name. This shows your account is authentic
                  and verified.
                </p>
                <div className="text-2xl font-bold">
                  $8<span className="text-sm font-normal text-gray-500">/month</span>
                </div>
              </div>

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm text-gray-600">
                  I agree to the verification terms and authorize the monthly charge.
                </span>
              </label>

              <Button
                onClick={handleSubmit}
                disabled={!agreedToTerms || loading}
                className="w-full bg-[#1d9bf0] hover:bg-[#1a8cd8]"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Subscribe & Verify"}
              </Button>
            </TabsContent>

            <TabsContent value="gold" className="space-y-4 mt-4">
              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="size-5 text-[#e2b719]" />
                  Business Verification
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  For businesses, brands, and organizations. Get a gold checkmark to show your
                  official business status.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                  />
                </div>
                <div>
                  <Label htmlFor="businessWebsite">Website *</Label>
                  <Input
                    id="businessWebsite"
                    value={businessWebsite}
                    onChange={(e) => setBusinessWebsite(e.target.value)}
                    placeholder="https://yourbusiness.com"
                  />
                </div>
                <div>
                  <Label htmlFor="businessCategory">Category *</Label>
                  <Input
                    id="businessCategory"
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    placeholder="e.g., Technology, Retail, Media"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!businessName || !businessWebsite || !businessCategory || loading}
                className="w-full bg-[#e2b719] hover:bg-[#c9a517] text-black"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Apply for Business Verification"}
              </Button>
            </TabsContent>

            <TabsContent value="government" className="space-y-4 mt-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Landmark className="size-5 text-[#8b98a5]" />
                  Government Verification
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  For government agencies, officials, and public institutions. Get a gray
                  checkmark to show your official government status.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="agencyName">Agency/Department Name *</Label>
                  <Input
                    id="agencyName"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="e.g., Department of State"
                  />
                </div>
                <div>
                  <Label htmlFor="officialEmail">Official Government Email *</Label>
                  <Input
                    id="officialEmail"
                    type="email"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    placeholder="your.name@agency.gov"
                  />
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!agencyName || !officialEmail || loading}
                className="w-full"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : "Apply for Government Verification"}
              </Button>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
