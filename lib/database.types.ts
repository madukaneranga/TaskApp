export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Enums: {
      user_role: "admin" | "user";
      user_status: "pending" | "active" | "rejected";
      task_status: "pending" | "in_progress" | "paused" | "completed";
      segment_type: "work" | "pause";
      otp_type: "signup" | "reset";
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: "admin" | "user";
          status: "pending" | "active" | "rejected";
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: "admin" | "user";
          status?: "pending" | "active" | "rejected";
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: "admin" | "user";
          status?: "pending" | "active" | "rejected";
          created_at?: string;
        };
        Relationships: [];
      };
      otps: {
        Row: {
          id: string;
          email: string;
          code: string;
          type: "signup" | "reset";
          payload: Json | null;
          expires_at: string;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          code: string;
          type: "signup" | "reset";
          payload?: Json | null;
          expires_at: string;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          code?: string;
          type?: "signup" | "reset";
          payload?: Json | null;
          expires_at?: string;
          used_at?: string | null;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          task_id: number;
          task_name: string;
          client_name: string;
          total_images_count: number;
          assigned_to: string;
          created_by: string;
          status: "pending" | "in_progress" | "paused" | "completed";
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: number;
          task_name: string;
          client_name: string;
          total_images_count?: number;
          assigned_to: string;
          created_by: string;
          status?: "pending" | "in_progress" | "paused" | "completed";
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: number;
          task_name?: string;
          client_name?: string;
          total_images_count?: number;
          assigned_to?: string;
          created_by?: string;
          status?: "pending" | "in_progress" | "paused" | "completed";
          created_at?: string;
        };
      };
      task_members: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
        };
      };
      sessions: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          duration: number;
          edited_images_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          start_time?: string;
          end_time?: string | null;
          duration?: number;
          edited_images_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string | null;
          duration?: number;
          edited_images_count?: number | null;
          created_at?: string;
        };
      };
      session_segments: {
        Row: {
          id: string;
          session_id: string;
          started_at: string;
          ended_at: string | null;
          type: "work" | "pause";
        };
        Insert: {
          id?: string;
          session_id: string;
          started_at?: string;
          ended_at?: string | null;
          type?: "work" | "pause";
        };
        Update: {
          id?: string;
          session_id?: string;
          started_at?: string;
          ended_at?: string | null;
          type?: "work" | "pause";
        };
      };
      notes: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          role: "admin" | "user";
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          role: "admin" | "user";
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          role?: "admin" | "user";
          content?: string;
          created_at?: string;
        };
      };
      status_history: {
        Row: {
          id: string;
          task_id: string;
          old_status: "pending" | "in_progress" | "paused" | "completed" | null;
          new_status: "pending" | "in_progress" | "paused" | "completed";
          changed_by: string;
          changed_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          old_status?: "pending" | "in_progress" | "paused" | "completed" | null;
          new_status: "pending" | "in_progress" | "paused" | "completed";
          changed_by: string;
          changed_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          old_status?: "pending" | "in_progress" | "paused" | "completed" | null;
          new_status?: "pending" | "in_progress" | "paused" | "completed";
          changed_by?: string;
          changed_at?: string;
        };
      };
    };
    CompositeTypes: Record<string, never>;
  };
}
