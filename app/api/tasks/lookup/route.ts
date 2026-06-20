import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseTaskId } from "@/lib/task-utils";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsedTaskId = parseTaskId(searchParams.get("taskId"));

  if (parsedTaskId === null) {
    return NextResponse.json({ error: "Valid task ID required" }, { status: 400 });
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("id, task_id, task_name")
    .eq("task_id", parsedTaskId)
    .maybeSingle();

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: task.id,
    task_id: task.task_id,
    task_name: task.task_name,
  });
}
