import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { user_id, action, role, new_password, user_code, full_name } = await request.json();
    const admin = createAdminClient();

    switch (action) {
      case "approve":
        await admin.from("users").update({ status: "active" }).eq("id", user_id);
        break;
      case "reject":
        await admin.from("users").update({ status: "rejected" }).eq("id", user_id);
        break;
      case "deactivate":
        await admin.from("users").update({ status: "pending" }).eq("id", user_id);
        break;
      case "change_role":
        if (!role) {
          return NextResponse.json({ error: "Role required" }, { status: 400 });
        }
        await admin.from("users").update({ role }).eq("id", user_id);
        break;
      case "reset_password":
        if (!new_password) {
          return NextResponse.json({ error: "Password required" }, { status: 400 });
        }
        await admin.auth.admin.updateUserById(user_id, { password: new_password });
        break;
      case "update_profile": {
        const updates: { user_code?: string; full_name?: string } = {};
        if (typeof user_code === "string") {
          const trimmedCode = user_code.trim();
          if (!trimmedCode) {
            return NextResponse.json({ error: "User code is required" }, { status: 400 });
          }
          const { data: taken } = await admin
            .from("users")
            .select("id")
            .eq("user_code", trimmedCode)
            .neq("id", user_id)
            .maybeSingle();
          if (taken) {
            return NextResponse.json({ error: "User code already taken" }, { status: 400 });
          }
          updates.user_code = trimmedCode;
        }
        if (typeof full_name === "string") {
          const trimmedName = full_name.trim();
          if (!trimmedName) {
            return NextResponse.json({ error: "Full name is required" }, { status: 400 });
          }
          updates.full_name = trimmedName;
        }
        if (Object.keys(updates).length === 0) {
          return NextResponse.json({ error: "No profile fields to update" }, { status: 400 });
        }
        await admin.from("users").update(updates).eq("id", user_id);
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
