import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseTaskId } from "@/lib/task-utils";
import type { TaskStatus } from "@/lib/types";

const VALID_STATUSES: TaskStatus[] = ["pending", "in_progress", "paused", "completed"];

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { task_id, task_name, client_name, total_images_count, assigned_to, status } = body;

    if (task_id == null || task_id === "" || !task_name?.trim() || !client_name?.trim()) {
      return NextResponse.json({ error: "Task ID, name, and client are required" }, { status: 400 });
    }

    const parsedTaskId = parseTaskId(task_id);
    if (parsedTaskId === null) {
      return NextResponse.json({ error: "Task ID must be numeric" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("tasks")
      .select("status")
      .eq("id", params.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }

      if (status !== existing.status) {
        const { data: openSession } = await supabase
          .from("sessions")
          .select("id")
          .eq("task_id", params.id)
          .is("end_time", null)
          .maybeSingle();

        if (openSession) {
          return NextResponse.json(
            { error: "Cannot change status while a session is active. Force pause first." },
            { status: 400 }
          );
        }
      }
    }

    const updates: Record<string, unknown> = {
      task_id: parsedTaskId,
      task_name: task_name.trim(),
      client_name: client_name.trim(),
      total_images_count: parseInt(total_images_count) || 0,
    };

    if (assigned_to) updates.assigned_to = assigned_to;
    if (status !== undefined) updates.status = status;

    const { data: task, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Task ID already exists" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
