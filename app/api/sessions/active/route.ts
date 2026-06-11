import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("task_id");

  if (!taskId) {
    return NextResponse.json({ error: "task_id required" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("id")
    .eq("task_id", taskId)
    .eq("user_id", user.id)
    .is("end_time", null)
    .maybeSingle();

  return NextResponse.json({ session_id: session?.id || null });
}
