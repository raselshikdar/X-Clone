"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch(
        `/api/auth/check-username?username=${encodeURIComponent(value)}`
      );
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  const checkEmailAvailability = useCallback(async (value: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailAvailable(null);
      return;
    }

    setCheckingEmail(true);
    try {
      const response = await fetch(
        `/api/auth/check-email?email=${encodeURIComponent(value)}`
      );
      const data = await response.json();
      setEmailAvailable(data.available);
    } catch {
      setEmailAvailable(null);
    } finally {
      setCheckingEmail(false);
    }
  }, []);

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        checkUsernameAvailability(username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailability]);

  // Debounced email check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email) {
        checkEmailAvailability(email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [email, checkEmailAvailability]);

  const handleStep1Submit = () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return;
    }
    if (emailAvailable === false) {
      setError("Email is already registered");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleStep2Submit = () => {
    if (!username || username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (usernameAvailable === false) {
      setError("Username is already taken");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }
    setError("");
    setStep(3);
  };

  const handleSignup = async () => {
    if (!passwordStrength.hasMinLength || !passwordStrength.hasUppercase || 
        !passwordStrength.hasLowercase || !passwordStrength.hasNumber) {
      setError("Password does not meet requirements");
      return;
    }
    if (!agreedToTerms) {
      setError("You must agree to the terms");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: name,
          email,
          username,
          password,
          birthDate: birthDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      // Auto sign in after signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Account created",
          description: "Please sign in with your credentials.",
        });
        onSwitchToLogin?.();
      } else {
        toast({
          title: "Welcome to X!",
          description: "Your account has been created successfully.",
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

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Create your account</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailAvailable(null);
              }}
              className="h-12 pr-10"
            />
            {checkingEmail ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />
            ) : emailAvailable === true ? (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
            ) : emailAvailable === false ? (
              <X className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
            ) : null}
          </div>
          {emailAvailable === false && (
            <p className="text-sm text-red-500">Email is already registered</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Date of birth</Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="h-12"
          />
          <p className="text-xs text-gray-500">
            This will not be shown publicly. Confirm your own age, even if this account is for a business, a pet, or something else.
          </p>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm text-center">{error}</div>}

      <Button
        type="button"
        onClick={handleStep1Submit}
        disabled={!name || !email || checkingEmail || emailAvailable === false}
        className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-bold"
      >
        Next
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setStep(1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Choose your username</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
            <Input
              id="username"
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase());
                setUsernameAvailable(null);
              }}
              className="h-12 pl-8 pr-10"
              maxLength={15}
            />
            {checkingUsername ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-gray-400" />
            ) : usernameAvailable === true ? (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
            ) : usernameAvailable === false ? (
              <X className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-500" />
            ) : null}
          </div>
          {usernameAvailable === false && (
            <p className="text-sm text-red-500">Username is already taken</p>
          )}
          {username && usernameAvailable === true && (
            <p className="text-sm text-green-500">Username is available!</p>
          )}
          <p className="text-xs text-gray-500">
            Your username must be 3-15 characters and can only contain letters, numbers, and underscores.
          </p>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm text-center">{error}</div>}

      <Button
        type="button"
        onClick={handleStep2Submit}
        disabled={!username || username.length < 3 || checkingUsername || usernameAvailable === false}
        className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-bold"
      >
        Next
      </Button>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => setStep(2)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Create a password</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/* Password strength indicator */}
        <div className="space-y-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1 flex-1 rounded-full ${
                  passwordStrength.score >= level
                    ? passwordStrength.score <= 1
                      ? "bg-red-500"
                      : passwordStrength.score <= 2
                      ? "bg-orange-500"
                      : passwordStrength.score <= 3
                      ? "bg-yellow-500"
                      : "bg-green-500"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <ul className="text-xs space-y-1">
            <li className={passwordStrength.hasMinLength ? "text-green-500" : "text-gray-500"}>
              {passwordStrength.hasMinLength ? <Check className="inline h-3 w-3 mr-1" /> : null}
              At least 8 characters
            </li>
            <li className={passwordStrength.hasUppercase ? "text-green-500" : "text-gray-500"}>
              {passwordStrength.hasUppercase ? <Check className="inline h-3 w-3 mr-1" /> : null}
              At least one uppercase letter
            </li>
            <li className={passwordStrength.hasLowercase ? "text-green-500" : "text-gray-500"}>
              {passwordStrength.hasLowercase ? <Check className="inline h-3 w-3 mr-1" /> : null}
              At least one lowercase letter
            </li>
            <li className={passwordStrength.hasNumber ? "text-green-500" : "text-gray-500"}>
              {passwordStrength.hasNumber ? <Check className="inline h-3 w-3 mr-1" /> : null}
              At least one number
            </li>
          </ul>
        </div>

        <div className="flex items-start space-x-2 pt-4">
          <Checkbox
            id="terms"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
          />
          <label htmlFor="terms" className="text-sm text-gray-600 leading-snug">
            I agree to the{" "}
            <a href="#" className="text-blue-500 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-blue-500 hover:underline">
              Privacy Policy
            </a>
          </label>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm text-center">{error}</div>}

      <Button
        type="button"
        onClick={handleSignup}
        disabled={isLoading || !password || !agreedToTerms || passwordStrength.score < 4}
        className="w-full h-12 bg-black hover:bg-gray-800 text-white rounded-full font-bold"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          "Create account"
        )}
      </Button>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress indicator */}
      <div className="mb-8">
        <Progress value={(step / 3) * 100} className="h-1" />
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Step {step} of 3</span>
          <span>{step === 1 ? "Account info" : step === 2 ? "Username" : "Password"}</span>
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {onSwitchToLogin && (
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-gray-600 mb-4">Already have an account?</p>
          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToLogin}
            className="w-full h-12 rounded-full font-bold text-blue-500 border-blue-500 hover:bg-blue-50"
          >
            Sign in
          </Button>
        </div>
      )}
    </div>
  );
}
