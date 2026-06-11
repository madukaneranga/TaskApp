"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastError, toastSuccess } from "@/lib/toast-helpers";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toastError("Request failed", data.error || "Please try again.");
      return;
    }

    toastSuccess("Reset code sent", "Check your email for the 6-digit code.");
    router.push(`/reset-password?email=${encodeURIComponent(email)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <Button type="submit" className="w-full bg-brand-blue" disabled={loading}>
        {loading ? "Sending..." : "Send Reset Code"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-brand-blue hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
