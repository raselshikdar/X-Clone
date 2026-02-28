"use client";

import { CheckCircle2, BadgeCheck, Building2, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

type VerificationType = "blue" | "gold" | "gray" | "government";

interface VerifiedBadgeProps {
  type?: VerificationType;
  size?: "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
}

const badgeConfig = {
  blue: {
    icon: BadgeCheck,
    color: "text-[#1d9bf0]",
    fill: "fill-[#1d9bf0]",
    label: "Verified account",
    description: "This account is verified",
  },
  gold: {
    icon: Building2,
    color: "text-[#e2b719]",
    fill: "fill-[#e2b719]",
    label: "Business account",
    description: "This is a verified business or organization",
  },
  gray: {
    icon: Landmark,
    color: "text-[#8b98a5]",
    fill: "fill-[#8b98a5]",
    label: "Government account",
    description: "This is a government or official account",
  },
  government: {
    icon: Landmark,
    color: "text-[#8b98a5]",
    fill: "fill-[#8b98a5]",
    label: "Government account",
    description: "This is a government or official account",
  },
};

const sizeConfig = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

export function VerifiedBadge({
  type = "blue",
  size = "md",
  className,
  showTooltip = true,
}: VerifiedBadgeProps) {
  const config = badgeConfig[type] || badgeConfig.blue;
  const Icon = config.icon;
  const sizeClass = sizeConfig[size];

  return (
    <span
      className={cn("inline-flex items-center", showTooltip && "cursor-pointer group relative")}
      title={showTooltip ? undefined : config.label}
    >
      <Icon className={cn(sizeClass, config.color, className)} />
      {showTooltip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          <div className="font-bold">{config.label}</div>
          <div className="text-gray-300">{config.description}</div>
        </span>
      )}
    </span>
  );
}

// Alternative badge using CheckCircle2 for blue checkmark
export function VerifiedBadgeAlt({
  type = "blue",
  size = "md",
  className,
}: VerifiedBadgeProps) {
  const config = badgeConfig[type] || badgeConfig.blue;
  const sizeClass = sizeConfig[size];

  return (
    <CheckCircle2
      className={cn(
        sizeClass,
        config.color,
        config.fill,
        "bg-white dark:bg-black rounded-full",
        className
      )}
    />
  );
}
