import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

async function finishSignIn(
  supabase: SupabaseClient,
  admin: ReturnType<typeof createAdminClient>,
  userId: string
) {
  const { data: profile } = await admin
    .from("users")
    .select("role, status")
    .eq("id", userId)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: "Could not load your profile. Please contact admin." };
  }

  if (profile.status === "pending") {
    await supabase.auth.signOut();
    return { error: "Your account is awaiting admin approval." };
  }

  if (profile.status === "rejected") {
    await supabase.auth.signOut();
    return { error: "Your account was not approved. Contact admin." };
  }

  return { signedIn: true as const, role: profile.role };
}

export async function POST(request: Request) {
  try {
    const { user_code, full_name, email, password } = await request.json();
    const trimmedCode = typeof user_code === "string" ? user_code.trim() : "";

    if (!trimmedCode || !full_name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const admin = createAdminClient();

    const [{ data: existingEmail }, { data: existingCode }] = await Promise.all([
      admin.from("users").select("id").eq("email", normalizedEmail).maybeSingle(),
      admin.from("users").select("id").eq("user_code", trimmedCode).maybeSingle(),
    ]);

    if (existingEmail) {
      const { data: authUser } = await admin.auth.admin.getUserById(existingEmail.id);
      if (authUser.user?.email_confirmed_at) {
        const supabase = createClient();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          return NextResponse.json(
            { error: "Email already registered. Sign in with your password." },
            { status: 400 }
          );
        }

        const result = await finishSignIn(supabase, admin, signInData.user.id);
        if ("error" in result) {
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          needsVerification: false,
          signedIn: true,
          role: result.role,
        });
      }

      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
      });

      if (resendError) {
        return NextResponse.json({ error: resendError.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, email: normalizedEmail, needsVerification: true });
    }

    if (existingCode) {
      return NextResponse.json({ error: "User code already taken" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          user_code: trimmedCode,
          full_name,
          status: "pending",
        },
      },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    const needsVerification = !authData.user.email_confirmed_at;

    if (needsVerification) {
      if (authData.session) {
        await supabase.auth.signOut();
      }
      return NextResponse.json({ success: true, email: normalizedEmail, needsVerification: true });
    }

    if (!authData.session) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        return NextResponse.json({ success: true, needsVerification: false });
      }

      const result = await finishSignIn(supabase, admin, signInData.user.id);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        needsVerification: false,
        signedIn: true,
        role: result.role,
      });
    }

    const result = await finishSignIn(supabase, admin, authData.user.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      needsVerification: false,
      signedIn: true,
      role: result.role,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Signup error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
