"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, ArrowLeft, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SignupFormProps {
  onSwitchToLogin?: () => void;
  onSuccess?: () => void;
}

interface PasswordStrength {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  score: number;
}

export function SignupForm({ onSwitchToLogin, onSuccess }: SignupFormProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { toast } = useToast();

  const passwordStrength: PasswordStrength = {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    score: [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
    ].filter(Boolean).length,
  };

  const checkUsernameAvailability = useCallback(async (value: string) => {
    if (value.length < 3) { setUsernameAvailable(null); return; }
    setCheckingUsername(true);
    try {
      const response = await fetch(`/api/auth/check-username?username=${encodeURIComponent(value)}`);
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch { setUsernameAvailable(null); }
    finally { setCheckingUsername(false); }
  }, []);

  const checkEmailAvailability = useCallback(async (value: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setEmailAvailable(null); return; }
    setCheckingEmail(true);
    try {
      const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(value)}`);
      const data = await response.json();
      setEmailAvailable(data.available);
    } catch { setEmailAvailable(null); }
    finally { setCheckingEmail(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { if (username) checkUsernameAvailability(username); }, 500);
    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailability]);

  useEffect(() => {
    const timer = setTimeout(() => { if (email) checkEmailAvailability(email); }, 500);
    return () => clearTimeout(timer);
  }, [email, checkEmailAvailability]);

  const handleStep1Submit = () => {
    if (!name.trim()) { setError("Name is required"); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email"); return; }
    if (emailAvailable === false) { setError("Email is already registered"); return; }
    setError(""); setStep(2);
  };

  const handleStep2Submit = () => {
    if (!username || username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (usernameAvailable === false) { setError("Username is already taken"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) { setError("Username can only contain letters, numbers, and underscores"); return; }
    setError(""); setStep(3);
  };

  const handleSignup = async () => {
    if (passwordStrength.score < 4) { setError("Password does not meet requirements"); return; }
    if (!agreedToTerms) { setError("You must agree to the terms"); return; }
    setIsLoading(true); setError("");
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name, email, username, password, birthDate: birthDate || undefined }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || "Something went wrong"); return; }
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        toast({ title: "Account created", description: "Please sign in." });
        onSwitchToLogin?.();
      } else {
        toast({ title: "Welcome to X!" });
        onSuccess?.();
        router.push("/"); router.refresh();
      }
    } catch { setError("Something went wrong. Please try again."); }
    finally { setIsLoading(false); }
  };

  const inputClass = cn(
    "h-14 px-4 pt-5 pb-2 rounded-[4px]",
    "bg-black border border-[#333639]",
    "text-white text-[17px]",
    "placeholder:text-transparent",
    "focus-visible:ring-1 focus-visible:ring-[#1d9bf0] focus-visible:border-[#1d9bf0]",
    "peer"
  );

  const labelClass = (val: string) => cn(
    "absolute left-4 text-[#71767b] pointer-events-none transition-all duration-150",
    val
      ? "top-1.5 text-xs"
      : "top-1/2 -translate-y-1/2 text-[17px] peer-focus:top-1.5 peer-focus:text-xs peer-focus:-translate-y-0"
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <h2 className="text-[31px] font-bold text-white mb-8 leading-tight">Create your account</h2>
      <div className="relative">
        <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Name" />
        <label htmlFor="name" className={labelClass(name)}>Name</label>
      </div>
      <div className="relative">
        <Input
          id="email" type="email" value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailAvailable(null); }}
          className={cn(inputClass, "pr-10")} placeholder="Email"
        />
        <label htmlFor="email" className={labelClass(email)}>Email</label>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {checkingEmail ? <Loader2 className="h-4 w-4 animate-spin text-[#71767b]" />
            : emailAvailable === true ? <Check className="h-4 w-4 text-green-500" />
            : emailAvailable === false ? <X className="h-4 w-4 text-red-500" /> : null}
        </div>
        {emailAvailable === false && <p className="text-sm text-red-500 mt-1">Email is already registered</p>}
      </div>
      <div className="relative">
        <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={cn(inputClass, "pt-2")} />
        <label htmlFor="birthDate" className="absolute left-4 top-1.5 text-xs text-[#71767b] pointer-events-none">Date of birth</label>
        <p className="text-xs text-[#71767b] mt-1.5">This will not be shown publicly.</p>
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <Button
        type="button" onClick={handleStep1Submit}
        disabled={!name || !email || checkingEmail || emailAvailable === false}
        className="w-full h-[50px] rounded-full font-bold text-[17px] bg-white hover:bg-gray-200 text-black disabled:opacity-50"
      >Next</Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 text-[#71767b] hover:text-white mb-4">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h2 className="text-[31px] font-bold text-white mb-8 leading-tight">Choose a username</h2>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#71767b] text-[17px] pointer-events-none z-10">@</span>
        <Input
          id="username" type="text" value={username}
          onChange={(e) => { setUsername(e.target.value.toLowerCase()); setUsernameAvailable(null); }}
          className={cn(inputClass, "pl-8 pr-10")} placeholder="username" maxLength={15}
        />
        <label htmlFor="username" className={cn(labelClass(username), "left-8")}>Username</label>
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {checkingUsername ? <Loader2 className="h-4 w-4 animate-spin text-[#71767b]" />
            : usernameAvailable === true ? <Check className="h-4 w-4 text-green-500" />
            : usernameAvailable === false ? <X className="h-4 w-4 text-red-500" /> : null}
        </div>
        {usernameAvailable === false && <p className="text-sm text-red-500 mt-1">Username is already taken</p>}
        <p className="text-xs text-[#71767b] mt-1.5">3–15 characters, letters, numbers, and underscores.</p>
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <Button
        type="button" onClick={handleStep2Submit}
        disabled={!username || username.length < 3 || checkingUsername || usernameAvailable === false}
        className="w-full h-[50px] rounded-full font-bold text-[17px] bg-white hover:bg-gray-200 text-black disabled:opacity-50"
      >Next</Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 text-[#71767b] hover:text-white mb-4">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h2 className="text-[31px] font-bold text-white mb-8 leading-tight">You&apos;ll need a password</h2>
      <p className="text-[#71767b] text-[15px] -mt-6">Make sure it&apos;s 8 characters or more.</p>
      <div className="relative">
        <Input
          id="password" type={showPassword ? "text" : "password"} value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={cn(inputClass, "pr-12")} placeholder="Password"
        />
        <label htmlFor="password" className={labelClass(password)}>Password</label>
        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71767b] hover:text-white">
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Password strength bars */}
      {password.length > 0 && (
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((level) => (
            <div key={level} className={cn("h-1 flex-1 rounded-full", passwordStrength.score >= level
              ? passwordStrength.score <= 1 ? "bg-red-500" : passwordStrength.score <= 2 ? "bg-orange-500" : passwordStrength.score <= 3 ? "bg-yellow-500" : "bg-green-500"
              : "bg-[#2f3336]"
            )} />
          ))}
        </div>
      )}

      {/* Terms checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <div
          onClick={() => setAgreedToTerms(!agreedToTerms)}
          className={cn(
            "mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors",
            agreedToTerms ? "bg-[#1d9bf0] border-[#1d9bf0]" : "border-[#71767b]"
          )}
        >
          {agreedToTerms && <Check className="h-3 w-3 text-white" />}
        </div>
        <span className="text-[#71767b] text-[13px] leading-snug">
          I agree to the{" "}
          <a href="#" className="text-[#1d9bf0] hover:underline">Terms of Service</a> and{" "}
          <a href="#" className="text-[#1d9bf0] hover:underline">Privacy Policy</a>
        </span>
      </label>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <Button
        type="button" onClick={handleSignup}
        disabled={isLoading || !password || !agreedToTerms || passwordStrength.score < 4}
        className="w-full h-[50px] rounded-full font-bold text-[17px] bg-white hover:bg-gray-200 text-black disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
      </Button>
    </div>
  );

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full transition-colors", step >= s ? "bg-[#1d9bf0]" : "bg-[#2f3336]")} />
          ))}
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {onSwitchToLogin && step === 1 && (
        <div className="mt-8">
          <p className="text-[15px] text-[#71767b]">
            Already have an account?{" "}
            <button type="button" onClick={onSwitchToLogin} className="text-[#1d9bf0] hover:underline font-medium">
              Log in
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
