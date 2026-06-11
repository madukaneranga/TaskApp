import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { task_id, content } = await request.json();

    if (!task_id || !content?.trim()) {
      return NextResponse.json({ error: "Task ID and content required" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const { data: note, error } = await supabase
      .from("notes")
      .insert({
        task_id,
        user_id: user.id,
        role: profile?.role || "user",
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ note });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
