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

    const { task_id } = await request.json();

    const { data: existing } = await supabase
      .from("sessions")
      .select("id, session_segments(id, ended_at)")
      .eq("task_id", task_id)
      .eq("user_id", user.id)
      .is("end_time", null)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Session already active" }, { status: 400 });
    }

    await supabase.from("tasks").update({ status: "in_progress" }).eq("id", task_id);

    const { data: session, error } = await supabase
      .from("sessions")
      .insert({ task_id, user_id: user.id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    await supabase.from("session_segments").insert({
      session_id: session.id,
      type: "work",
    });

    return NextResponse.json({ session });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
