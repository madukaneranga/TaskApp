"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OtpInput } from "@/components/auth/otp-input";
import { toastError, toastSuccess } from "@/lib/toast-helpers";

interface ResetPasswordFormProps {
  email: string;
}

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toastError("Invalid code", "Please enter the full 6-digit code.");
      return;
    }
    if (password !== confirmPassword) {
      toastError("Passwords do not match", "Please make sure both passwords are the same.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toastError("Reset failed", data.error || "Please try again.");
      return;
    }

    toastSuccess("Password updated", "You can now sign in with your new password.");
    router.push("/login");
  }

  async function handleResend() {
    if (resendCooldown > 0) return;

    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "reset" }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toastError("Could not resend code", data.error || "Please try again.");
      return;
    }

    toastSuccess("Code resent", "Check your email for a new code.");
    setResendCooldown(60);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <OtpInput value={otp} onChange={setOtp} disabled={loading} />
      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
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
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
      <div className="text-center text-sm">
        {resendCooldown > 0 ? (
          <span className="text-muted-foreground">Resend code in {resendCooldown}s</span>
        ) : (
          <button type="button" onClick={handleResend} className="text-brand-blue hover:underline">
            Resend code
          </button>
        )}
      </div>
      <p className="text-center text-sm">
        <Link href="/login" className="text-brand-blue hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
