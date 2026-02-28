"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        setError("Invalid email/username or password");
        toast({
          title: "Login failed",
          description: "Invalid email/username or password",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
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
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Sign in to X</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="identifier">Email or username</Label>
          <Input
            id="identifier"
            type="text"
            placeholder="Email or username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={isLoading}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="h-12 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !identifier || !password}
          className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-bold"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Log in"
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          type="button"
          className="text-sm text-blue-500 hover:underline"
        >
          Forgot password?
        </button>
      </div>

      <div className="mt-8 pt-6 border-t text-center">
        <p className="text-sm text-gray-600 mb-4">Don&apos;t have an account?</p>
        <Button
          type="button"
          variant="outline"
          onClick={onSwitchToSignup}
          className="w-full h-12 rounded-full font-bold text-blue-500 border-blue-500 hover:bg-blue-50"
        >
          Sign up for X
        </Button>
      </div>
    </div>
  );
}
