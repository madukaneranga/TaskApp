"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import { formatDateTime } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import type { PaginationMeta } from "@/lib/pagination";
import type { Note } from "@/lib/types";

interface NotesThreadProps {
  taskId: string;
  notes: Note[];
  pagination?: PaginationMeta;
  pageParam?: string;
}

export function NotesThread({
  taskId,
  notes,
  pagination,
  pageParam = "notesPage",
}: NotesThreadProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_id: taskId, content }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toastError("Could not add note", data.error || "Please try again.");
      return;
    }

    toastSuccess("Note added");
    setContent("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Notes & Remarks</h3>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{note.user?.full_name || "Unknown"}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize">
                  {note.role}
                </span>
                <span className="text-muted-foreground">{formatDateTime(note.created_at)}</span>
              </div>
              <p className="mt-2 text-sm">{note.content}</p>
            </div>
          ))}
        </div>
      )}

      {pagination && (
        <Suspense fallback={null}>
          <Pagination pagination={pagination} pageParam={pageParam} />
        </Suspense>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a note or remark..."
        />
        <Button type="submit" size="sm" className="bg-brand-blue" disabled={loading || !content.trim()}>
          {loading ? "Adding..." : "Add Note"}
        </Button>
      </form>
    </div>
  );
}
