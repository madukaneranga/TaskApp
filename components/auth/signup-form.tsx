"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastError, toastSuccess } from "@/lib/toast-helpers";

export function SignupForm() {
  const router = useRouter();
  const [userCode, setUserCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      toastError("Passwords do not match", "Please make sure both passwords are the same.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_code: userCode, full_name: fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toastError("Signup failed", data.error || "Please try again.");
        return;
      }

      if (data.signedIn) {
        toastSuccess("Welcome back!");
        router.push(data.role === "admin" ? "/admin" : "/dashboard");
        router.refresh();
        return;
      }

      if (data.needsVerification) {
        toastSuccess("Check your email", "We sent a 6-digit code to verify your address.");
        router.push(`/verify-email?email=${encodeURIComponent(data.email || email.toLowerCase())}`);
        return;
      }

      toastSuccess("Account ready", "Your email is already verified. You can sign in.");
      router.push("/login");
    } catch {
      toastError("Signup failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userCode">User Code</Label>
        <Input
          id="userCode"
          value={userCode}
          onChange={(e) => setUserCode(e.target.value)}
          placeholder="e.g. DT-001"
          required
        />
        <p className="text-xs text-muted-foreground">
          Your identifier shown on tasks and reports (not your full name).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <Button type="submit" className="w-full bg-brand-blue" disabled={loading}>
        {loading ? "Creating account..." : "Sign Up"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-blue hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
