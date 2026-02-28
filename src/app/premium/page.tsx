"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Check, 
  Crown, 
  Verified, 
  Edit3, 
  Bookmark, 
  BarChart3, 
  Zap,
  Shield,
  MessageCircle,
  X
} from "lucide-react";

const premiumFeatures = [
  {
    icon: Verified,
    title: "Verification",
    description: "Get the blue checkmark and stand out on X"
  },
  {
    icon: Edit3,
    title: "Edit posts",
    description: "Edit your posts up to 1 hour after posting"
  },
  {
    icon: Bookmark,
    title: "Bookmarks folders",
    description: "Organize your saved posts into folders"
  },
  {
    icon: BarChart3,
    title: "Post analytics",
    description: "See how your posts perform in detail"
  },
  {
    icon: Zap,
    title: "Longer posts",
    description: "Write posts up to 25,000 characters"
  },
  {
    icon: Shield,
    title: "App encryption",
    description: "Extra layer of security for your account"
  },
  {
    icon: Crown,
    title: "Ad-free experience",
    description: "See fewer ads in For You and Following"
  },
  {
    icon: MessageCircle,
    title: "Priority support",
    description: "Get faster responses from support team"
  }
];

const subscriptionPlans = [
  {
    id: "basic",
    name: "Basic",
    price: 3,
    period: "month",
    features: [
      "Edit posts (within 1 hour)",
      "Longer posts (10,000 chars)",
      "Reply boost",
      "Ad-free articles"
    ],
    highlighted: false
  },
  {
    id: "premium",
    name: "Premium",
    price: 8,
    period: "month",
    features: [
      "Everything in Basic",
      "Blue checkmark",
      "25,000 character posts",
      "Post analytics",
      "Bookmarks folders",
      "Ad-free For You & Following",
      "App encryption"
    ],
    highlighted: true
  },
  {
    id: "annual",
    name: "Premium Annual",
    price: 84,
    period: "year",
    savings: "Save 12%",
    features: [
      "Everything in Premium",
      "2 months free",
      "Priority support"
    ],
    highlighted: false
  }
];

export default function PremiumPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleSubscribe = (planId: string) => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/premium");
      return;
    }
    setSelectedPlan(planId);
    setShowCheckout(true);
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="min-h-screen bg-black text-white">
        {/* Hero Section */}
        <div className="border-b border-twitter-border-dark">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-twitter-blue/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-twitter-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">X Premium</h1>
                <p className="text-gray-500">Unlock exclusive features</p>
              </div>
            </div>
            
            <p className="text-lg text-gray-300 mb-6">
              Subscribe to X Premium to get exclusive features that help you stand out and express yourself.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {premiumFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-2xl bg-[#16181c] border border-twitter-border-dark"
                >
                  <feature.icon className="w-6 h-6 text-twitter-blue mb-2" />
                  <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold mb-6">Choose your plan</h2>
          
          <div className="grid gap-4">
            {subscriptionPlans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "relative p-6 rounded-2xl border transition-all cursor-pointer",
                  plan.highlighted
                    ? "bg-twitter-blue/10 border-twitter-blue"
                    : "bg-[#16181c] border-twitter-border-dark hover:border-gray-600",
                  selectedPlan === plan.id && "ring-2 ring-twitter-blue"
                )}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.savings && (
                  <span className="absolute top-4 right-4 bg-green-500/20 text-green-400 text-xs font-semibold px-2 py-1 rounded-full">
                    {plan.savings}
                  </span>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      <span className="text-gray-500">/{plan.period}</span>
                    </div>
                  </div>
                  {plan.highlighted && (
                    <span className="bg-twitter-blue text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(plan.id);
                  }}
                  className={cn(
                    "w-full rounded-full font-bold",
                    plan.highlighted
                      ? "bg-twitter-blue hover:bg-twitter-blue/90 text-white"
                      : "bg-white hover:bg-gray-100 text-black"
                  )}
                >
                  {isAuthenticated ? "Subscribe" : "Sign up to subscribe"}
                </Button>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-8 p-4 rounded-2xl bg-[#16181c] border border-twitter-border-dark">
            <h3 className="font-semibold mb-2">Terms & Conditions</h3>
            <p className="text-sm text-gray-500">
              Subscriptions auto-renew unless canceled. Prices may vary by region. 
              Verification criteria apply. Features may change. By subscribing, you 
              agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        {/* Checkout Modal */}
        {showCheckout && selectedPlan && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#16181c] rounded-2xl max-w-md w-full p-6 border border-twitter-border-dark">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Complete your purchase</h2>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="p-2 rounded-full hover:bg-twitter-hover-dark"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="border-b border-twitter-border-dark pb-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Plan</span>
                  <span className="font-semibold">
                    {subscriptionPlans.find(p => p.id === selectedPlan)?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-500">Price</span>
                  <span className="font-semibold">
                    ${subscriptionPlans.find(p => p.id === selectedPlan)?.price}/
                    {subscriptionPlans.find(p => p.id === selectedPlan)?.period}
                  </span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3 mb-4">
                <button className="w-full p-3 rounded-xl border border-twitter-border-dark hover:border-gray-600 flex items-center gap-3 text-left">
                  <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                    P
                  </div>
                  <span>PayPal</span>
                </button>
                <button className="w-full p-3 rounded-xl border border-twitter-border-dark hover:border-gray-600 flex items-center gap-3 text-left">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
                    C
                  </div>
                  <span>Credit/Debit Card</span>
                </button>
              </div>

              <Button
                className="w-full rounded-full font-bold bg-twitter-blue hover:bg-twitter-blue/90"
              >
                Pay now
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                This is a demo. No actual payment will be processed.
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
