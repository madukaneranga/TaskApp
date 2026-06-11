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

    const { title, description } = await request.json();

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const { data: report, error } = await supabase
      .from("problem_reports")
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
      })
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
