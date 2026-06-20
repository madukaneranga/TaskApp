import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { closeAllOpenSegments } from "@/lib/close-open-sessions";
import { calculateWorkDuration } from "@/lib/session-utils";
import { parseImageCount } from "@/lib/task-utils";

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

    const parsedEditedCount = parseImageCount(edited_images_count);
    if (parsedEditedCount === null) {
      return NextResponse.json({ error: "Edited images must be at least 1" }, { status: 400 });
    }

    const { data: task } = await supabase
      .from("tasks")
      .select("total_images_count")
      .eq("id", session.task_id)
      .single();

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (parsedEditedCount > task.total_images_count) {
      return NextResponse.json(
        { error: "Edited images cannot exceed total images" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const updatedSegments = await closeAllOpenSegments(supabase, session_id, now);
    const duration = calculateWorkDuration(updatedSegments);

    await supabase
      .from("sessions")
      .update({
        end_time: now,
        duration,
        edited_images_count: parsedEditedCount,
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
