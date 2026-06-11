export type UserRole = "admin" | "user";
export type UserStatus = "pending" | "active" | "rejected";
export type TaskStatus = "pending" | "in_progress" | "paused" | "completed";
export type SegmentType = "work" | "pause";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

export interface Task {
  id: string;
  task_id: number;
  task_name: string;
  client_name: string;
  total_images_count: number;
  assigned_to: string;
  created_by: string;
  status: TaskStatus;
  created_at: string;
  start_time?: string | null;
  end_time?: string | null;
  total_duration?: number;
  total_span_duration?: number;
  edited_images_count?: number | null;
  assigned_user?: User;
  created_user?: User;
}

export interface Session {
  id: string;
  task_id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration: number;
  edited_images_count: number | null;
  created_at: string;
  task?: Task;
  user?: User;
  segments?: SessionSegment[];
}

export interface SessionSegment {
  id: string;
  session_id: string;
  started_at: string;
  ended_at: string | null;
  type: SegmentType;
}

export interface Note {
  id: string;
  task_id: string;
  user_id: string;
  role: UserRole;
  content: string;
  created_at: string;
  user?: User;
}

export interface StatusHistoryEntry {
  id: string;
  task_id: string;
  old_status: TaskStatus | null;
  new_status: TaskStatus;
  changed_by: string;
  changed_at: string;
  changed_by_user?: User;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  paused: "Paused",
  completed: "Completed",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  pending: "Pending",
  active: "Active",
  rejected: "Rejected",
};
