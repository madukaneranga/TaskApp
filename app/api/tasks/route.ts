import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CLIENT_NAME, parseTaskId } from "@/lib/task-utils";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { task_id, task_name, client_name, total_images_count, assigned_to, start_immediately } =
      body;

    if (task_id == null || task_id === "" || !task_name) {
      return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
    }

    const parsedTaskId = parseTaskId(task_id);
    if (parsedTaskId === null) {
      return NextResponse.json({ error: "Task ID must be numeric" }, { status: 400 });
    }

    const resolvedClientName = client_name?.trim() || DEFAULT_CLIENT_NAME;

    const status = start_immediately ? "in_progress" : "pending";

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        task_id: parsedTaskId,
        task_name,
        client_name: resolvedClientName,
        total_images_count: total_images_count || 0,
        assigned_to: assigned_to || user.id,
        created_by: user.id,
        status,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (start_immediately) {
      const { data: session } = await supabase
        .from("sessions")
        .insert({
          task_id: task.id,
          user_id: assigned_to || user.id,
        })
        .select()
        .single();

      if (session) {
        await supabase.from("session_segments").insert({
          session_id: session.id,
          type: "work",
        });
      }
    }

    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
