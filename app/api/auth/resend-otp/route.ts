import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();

    if (!email || !type) {
      return NextResponse.json({ error: "Email and type are required" }, { status: 400 });
    }

    const supabase = createClient();

    if (type === "signup") {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.toLowerCase(),
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else if (type === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase());
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
