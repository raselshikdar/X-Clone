"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LoginFormProps {
  onSwitchToSignup?: () => void;
  onSuccess?: () => void;
}

export function LoginForm({ onSwitchToSignup, onSuccess }: LoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Wrong email, phone, or password.");
        toast({ title: "Login failed", description: "Check your credentials.", variant: "destructive" });
      } else {
        toast({ title: "Welcome back!" });
        onSuccess?.();
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <h2 className="text-[31px] font-bold text-white mb-8 leading-tight">
        Sign in to X
      </h2>

      {/* Social sign-in buttons */}
      <div className="space-y-3 mb-6">
        <button
          type="button"
          className="w-full h-10 flex items-center justify-center gap-3 rounded-full bg-white hover:bg-gray-100 transition-colors font-semibold text-[15px] text-black"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
        <button
          type="button"
          className="w-full h-10 flex items-center justify-center gap-3 rounded-full bg-white hover:bg-gray-100 transition-colors font-semibold text-[15px] text-black"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="black">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm3.21 7.16h-1.66c-.19 0-.4.25-.4.59v1.2h2.06l-.27 2.05h-1.79V19h-2.12v-5.96h-1.4v-2.05h1.4V9.63c0-1.59.99-2.46 2.39-2.46.68 0 1.39.05 2.06.1l-.27 1.89z"/>
          </svg>
          Sign in with Apple
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-[#2f3336]" />
        <span className="text-[15px] text-[#71767b]">or</span>
        <div className="flex-1 h-px bg-[#2f3336]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <Input
            id="identifier"
            type="text"
            placeholder="Phone, email, or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={isLoading}
            className={cn(
              "h-14 px-4 pt-5 pb-2 rounded-[4px]",
              "bg-black border border-[#333639]",
              "text-white text-[17px]",
              "placeholder:text-transparent",
              "focus-visible:ring-1 focus-visible:ring-[#1d9bf0] focus-visible:border-[#1d9bf0]",
              "peer"
            )}
          />
          <label
            htmlFor="identifier"
            className={cn(
              "absolute left-4 text-[#71767b] pointer-events-none transition-all duration-150",
              identifier
                ? "top-1.5 text-xs"
                : "top-1/2 -translate-y-1/2 text-[17px] peer-focus:top-1.5 peer-focus:text-xs peer-focus:-translate-y-0"
            )}
          >
            Phone, email, or username
          </label>
        </div>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className={cn(
              "h-14 px-4 pt-5 pb-2 pr-12 rounded-[4px]",
              "bg-black border border-[#333639]",
              "text-white text-[17px]",
              "placeholder:text-transparent",
              "focus-visible:ring-1 focus-visible:ring-[#1d9bf0] focus-visible:border-[#1d9bf0]",
              "peer"
            )}
          />
          <label
            htmlFor="password"
            className={cn(
              "absolute left-4 text-[#71767b] pointer-events-none transition-all duration-150",
              password
                ? "top-1.5 text-xs"
                : "top-1/2 -translate-y-1/2 text-[17px] peer-focus:top-1.5 peer-focus:text-xs peer-focus:-translate-y-0"
            )}
          >
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71767b] hover:text-white"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="button"
          className="w-full text-[15px] text-white font-bold text-left hover:underline"
        >
          Forgot password?
        </button>

        <Button
          type="submit"
          disabled={isLoading || !identifier || !password}
          className="w-full h-[50px] rounded-full font-bold text-[17px] bg-white hover:bg-gray-200 text-black disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Log in"}
        </Button>
      </form>

      <div className="mt-10">
        <p className="text-[15px] text-[#71767b]">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="text-[#1d9bf0] hover:underline font-medium"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
