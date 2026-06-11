"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import { DEFAULT_CLIENT_NAME, isNumericTaskId } from "@/lib/task-utils";
import type { User } from "@/lib/types";

interface TaskFormProps {
  users?: User[];
  currentUserId: string;
  isAdmin: boolean;
}

export function TaskForm({ users = [], currentUserId, isAdmin }: TaskFormProps) {
  const router = useRouter();
  const [taskId, setTaskId] = useState("");
  const [taskName, setTaskName] = useState("");
  const clientName = DEFAULT_CLIENT_NAME;
  const [imageCount, setImageCount] = useState("");
  const [assignedTo, setAssignedTo] = useState(currentUserId);
  const [loading, setLoading] = useState(false);

  async function submit(startImmediately: boolean) {
    if (!isNumericTaskId(taskId)) {
      toastError("Invalid Task ID", "Task ID must be a number.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task_id: taskId,
        task_name: taskName,
        client_name: clientName,
        total_images_count: parseInt(imageCount) || 0,
        assigned_to: assignedTo,
        start_immediately: startImmediately,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toastError("Could not create task", data.error || "Please try again.");
      setLoading(false);
      return;
    }

    toastSuccess(
      startImmediately ? "Task created and started" : "Task created",
      data.task.task_name
    );
    router.push(startImmediately ? "/dashboard" : `/tasks/${data.task.id}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="max-w-lg space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="taskId">Task ID</Label>
        <Input
          id="taskId"
          type="number"
          min="1"
          step="1"
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          required
          placeholder="Numeric task ID"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="taskName">Task Name</Label>
        <Input
          id="taskName"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="clientName">Client Name</Label>
        <Input id="clientName" value={clientName} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="imageCount">Total Images</Label>
        <Input
          id="imageCount"
          type="number"
          min="0"
          value={imageCount}
          onChange={(e) => setImageCount(e.target.value)}
          required
        />
      </div>
      {isAdmin && users.length > 0 && (
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
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" variant="outline" disabled={loading} className="flex-1">
          Create
        </Button>
        <Button
          type="button"
          disabled={loading}
          className="flex-1 bg-brand-blue"
          onClick={() => submit(true)}
        >
          Create & Start
        </Button>
      </div>
    </form>
  );
}
