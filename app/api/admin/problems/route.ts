import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProblemStatus } from "@/lib/types";

const VALID_STATUSES: ProblemStatus[] = ["open", "in_progress", "resolved", "closed"];

export async function PATCH(request: Request) {
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

    const { report_id, status, admin_response } = await request.json();

    if (!report_id) {
      return NextResponse.json({ error: "Report ID required" }, { status: 400 });
    }

    const updates: {
      status?: ProblemStatus;
      admin_response?: string | null;
      updated_at: string;
    } = { updated_at: new Date().toISOString() };

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      updates.status = status;
    }

    if (admin_response !== undefined) {
      updates.admin_response = admin_response?.trim() || null;
    }

    if (Object.keys(updates).length === 1) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: report, error } = await supabase
      .from("problem_reports")
      .update(updates)
      .eq("id", report_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
