"use client";

import { useSession, signOut, signIn } from "next-auth/react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SignupData {
  name: string;
  email: string;
  username: string;
  password: string;
  birthDate?: string;
}

interface UseAuthReturn {
  user: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
    username?: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const user = session?.user ?? null;
  const isAuthenticated = status === "authenticated";
  const isSessionLoading = status === "loading";

  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: "Invalid email/username or password" };
      }

      router.refresh();
      return { success: true };
    } catch {
      return { success: false, error: "Something went wrong" };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const signup = useCallback(async (data: SignupData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || "Signup failed" };
      }

      // Auto sign in after signup
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        return { success: true, error: "Account created but auto-login failed. Please sign in." };
      }

      router.refresh();
      return { success: true };
    } catch {
      return { success: false, error: "Something went wrong" };
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  }, [router]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isSessionLoading,
    login,
    signup,
    logout,
  };
}
