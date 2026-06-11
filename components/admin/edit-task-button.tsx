"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import { DEFAULT_CLIENT_NAME, isNumericTaskId } from "@/lib/task-utils";
import { TASK_STATUS_LABELS, type Task, type TaskStatus, type User } from "@/lib/types";

interface EditTaskButtonProps {
  task: Task;
  users: User[];
  hasActiveSession?: boolean;
}

export function EditTaskButton({ task, users, hasActiveSession = false }: EditTaskButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState(String(task.task_id));
  const [taskName, setTaskName] = useState(task.task_name);
  const clientName = DEFAULT_CLIENT_NAME;
  const [imageCount, setImageCount] = useState(String(task.total_images_count));
  const [assignedTo, setAssignedTo] = useState(task.assigned_to);
  const [status, setStatus] = useState<TaskStatus>(task.status);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setTaskId(String(task.task_id));
      setTaskName(task.task_name);
      setImageCount(String(task.total_images_count));
      setAssignedTo(task.assigned_to);
      setStatus(task.status);
    }
    setOpen(nextOpen);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!isNumericTaskId(taskId)) {
      toastError("Invalid Task ID", "Task ID must be a number.");
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: taskId,
        task_name: taskName,
        client_name: clientName,
        total_images_count: parseInt(imageCount) || 0,
        assigned_to: assignedTo,
        status,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toastError("Could not update task", data.error || "Please try again.");
      return;
    }

    toastSuccess("Task updated", taskName);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => handleOpenChange(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Edit
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task details. Changes apply immediately.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTaskId">Task ID</Label>
              <Input
                id="editTaskId"
                type="number"
                min="1"
                step="1"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTaskName">Task Name</Label>
              <Input
                id="editTaskName"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editClientName">Client Name</Label>
              <Input id="editClientName" value={clientName} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editImageCount">Total Images</Label>
              <Input
                id="editImageCount"
                type="number"
                min="0"
                value={imageCount}
                onChange={(e) => setImageCount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.user_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as TaskStatus)}
                disabled={hasActiveSession}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {TASK_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveSession && (
                <p className="text-xs text-muted-foreground">
                  Status cannot be changed while a session is active.
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-brand-blue" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
