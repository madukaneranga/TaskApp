import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase(),
      token: code,
      type: "signup",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Verification failed" }, { status: 400 });
    }

    const fullName =
      (data.user.user_metadata?.full_name as string) || email.split("@")[0];

    const admin = createAdminClient();
    await admin.from("users").upsert({
      id: data.user.id,
      email: email.toLowerCase(),
      full_name: fullName,
      role: "user",
      status: "pending",
    });

    // Don't keep the user logged in — they must wait for admin approval
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
