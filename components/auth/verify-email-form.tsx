"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/otp-input";
import { toastError, toastSuccess } from "@/lib/toast-helpers";

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toastError("Invalid code", "Please enter the full 6-digit code.");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: otp }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toastError("Verification failed", data.error || "Please try again.");
      return;
    }

    toastSuccess("Email verified", "Your account is awaiting admin approval.");
    setSuccess(true);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;

    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: "signup" }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toastError("Could not resend code", data.error || "Please try again.");
      return;
    }

    toastSuccess("Code resent", "Check your email for a new code.");
    setResendCooldown(60);
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Your email is verified. Your account is awaiting admin approval.
        </p>
        <Button className="w-full bg-brand-blue" onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-6">
      <p className="text-center text-sm text-muted-foreground">
        Code sent to <strong>{email}</strong>
      </p>
      <OtpInput value={otp} onChange={setOtp} disabled={loading} />
      <Button type="submit" className="w-full bg-brand-blue" disabled={loading || otp.length !== 6}>
        {loading ? "Verifying..." : "Verify Email"}
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
