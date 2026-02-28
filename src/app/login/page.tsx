"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";

export default function LoginPage() {
  const [view, setView] = useState<"login" | "signup">("login");
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero section */}
      <div className="hidden lg:flex lg:flex-1 bg-black items-center justify-center">
        <svg viewBox="0 0 24 24" className="h-96 w-96 fill-white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <svg viewBox="0 0 24 24" className="h-16 w-16 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>

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
      </div>
    </div>
  );
}
