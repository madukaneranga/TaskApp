import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProblemsView } from "@/components/problems/problems-view";
import type { ProblemReport } from "@/lib/types";

export default async function ProblemsPage() {
  const currentUser = await requireUser();
  const supabase = createClient();
  const isAdmin = currentUser.role === "admin";

  let query = supabase
    .from("problem_reports")
    .select("*, user:users(id, user_code, full_name)")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query = query.eq("user_id", currentUser.id);
  }

  const { data: reports } = await query;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy dark:text-foreground">
          Report a Problem
        </h1>
        <p className="text-muted-foreground">
          Tell us about app issues and track their status
        </p>
      </div>
      <ProblemsView
        reports={(reports || []) as ProblemReport[]}
        isAdmin={isAdmin}
      />
    </div>
  );
}
