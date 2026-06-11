import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "@/components/tasks/task-form";
import type { User } from "@/lib/types";

export default async function NewTaskPage() {
  const user = await requireUser();
  const supabase = createClient();

  let users: User[] = [];
  if (user.role === "admin") {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("status", "active")
      .order("full_name");
    users = (data || []) as User[];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy dark:text-foreground">New Task</h1>
        <p className="text-muted-foreground">Create a new client order</p>
      </div>
      <TaskForm users={users} currentUserId={user.id} isAdmin={user.role === "admin"} />
    </div>
  );
}
