import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { closeAllOpenSegments } from "@/lib/close-open-sessions";
import { calculateWorkDuration } from "@/lib/session-utils";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session_id, edited_images_count, notes } = await request.json();

    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (!session || session.user_id !== user.id) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const now = new Date().toISOString();

    const updatedSegments = await closeAllOpenSegments(supabase, session_id, now);
    const duration = calculateWorkDuration(updatedSegments);

    await supabase
      .from("sessions")
      .update({
        end_time: now,
        duration,
        edited_images_count,
      })
      .eq("id", session_id);

    await supabase.from("tasks").update({ status: "completed" }).eq("id", session.task_id);

    if (notes?.trim()) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      await supabase.from("notes").insert({
        task_id: session.task_id,
        user_id: user.id,
        role: profile?.role || "user",
        content: notes.trim(),
      });
    }

    return NextResponse.json({ success: true, duration });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
