"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultView?: "login" | "signup";
}

export function AuthModal({ open, onOpenChange, defaultView = "login" }: AuthModalProps) {
  const [view, setView] = useState<"login" | "signup">(defaultView);

  const handleSuccess = () => {
    onOpenChange(false);
    setView("login");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-black border border-[#2f3336] rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 relative">
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <DialogTitle className="absolute left-1/2 -translate-x-1/2">
            <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white mx-auto">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </DialogTitle>
          <div className="w-9" />
        </div>

        {/* Body */}
        <div className="px-20 pb-10 pt-2">
          {view === "login" ? (
            <LoginForm
              onSwitchToSignup={() => setView("signup")}
              onSuccess={handleSuccess}
            />
          ) : (
            <SignupForm
              onSwitchToLogin={() => setView("login")}
              onSuccess={handleSuccess}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
