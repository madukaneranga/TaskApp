"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toastError, toastSuccess } from "@/lib/toast-helpers";

interface LoginFormProps {
  initialMessage?: string;
}

export function LoginForm({ initialMessage }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialMessage) {
      toastError("Sign in unavailable", initialMessage);
    }
  }, [initialMessage]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      });

      if (authError) {
        toastError("Sign in failed", authError.message);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, status")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        toastError("Sign in failed", "Could not load your profile. Please contact admin.");
        return;
      }

      if (profile.status === "pending") {
        await supabase.auth.signOut();
        toastError("Account pending", "Your account is awaiting admin approval.");
        return;
      }

      if (profile.status === "rejected") {
        await supabase.auth.signOut();
        toastError("Account not approved", "Your account was not approved. Contact admin.");
        return;
      }

      toastSuccess("Welcome back!");
      router.push(profile.role === "admin" ? "/admin" : "/dashboard");
      router.refresh();
    } catch {
      toastError("Sign in failed", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
          autoComplete="email"
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
          autoComplete="current-password"
        />
      </div>
      <Button type="submit" className="w-full bg-brand-blue" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </Button>
      <div className="flex flex-col gap-2 text-center text-sm">
        <Link href="/forgot-password" className="text-brand-blue hover:underline">
          Forgot password?
        </Link>
        <p className="text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand-blue hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}

