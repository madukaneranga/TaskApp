import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  auditTaskIdRange,
  parseExceptTaskIds,
  parseTaskIdRange,
} from "@/lib/task-id-range-audit";
import type { TaskStatus } from "@/lib/types";

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const parsedRange = parseTaskIdRange(
      searchParams.get("from"),
      searchParams.get("to")
    );

    if (!parsedRange.ok) {
      return NextResponse.json({ error: parsedRange.error }, { status: 400 });
    }

    const parsedExcept = parseExceptTaskIds(
      searchParams.get("except"),
      parsedRange.range
    );

    if (!parsedExcept.ok) {
      return NextResponse.json({ error: parsedExcept.error }, { status: 400 });
    }

    const { from, to } = parsedRange.range;

    const { data: tasks, error } = await supabase
      .from("tasks")
      .select("id, task_id, task_name, status, assigned_user:users!tasks_assigned_to_fkey(full_name)")
      .gte("task_id", from)
      .lte("task_id", to)
      .order("task_id", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const audit = auditTaskIdRange(
      parsedRange.range,
      (tasks || []).map((task) => {
        const assignedUser = Array.isArray(task.assigned_user)
          ? task.assigned_user[0]
          : task.assigned_user;

        return {
          id: task.id,
          task_id: task.task_id,
          task_name: task.task_name,
          status: task.status as TaskStatus,
          assigned_user: assignedUser ?? null,
        };
      }),
      parsedExcept.ids
    );

    return NextResponse.json(audit);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
