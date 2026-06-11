"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toastError } from "@/lib/toast-helpers";

interface SubmitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  totalImages: number;
  onSuccess: () => void;
}

export function SubmitModal({
  open,
  onOpenChange,
  sessionId,
  totalImages,
  onSuccess,
}: SubmitModalProps) {
  const [editedCount, setEditedCount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/sessions/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        edited_images_count: parseInt(editedCount) || 0,
        notes,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toastError("Submit failed", data.error || "Please try again.");
      setLoading(false);
      return;
    }

    onOpenChange(false);
    setLoading(false);
    onSuccess();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Task</DialogTitle>
          <DialogDescription>
            Enter the number of edited images and any notes before completing this task.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="editedCount">
              Edited Images (of {totalImages})
            </Label>
            <Input
              id="editedCount"
              type="number"
              min="0"
              max={totalImages}
              value={editedCount}
              onChange={(e) => setEditedCount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Remarks</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this task..."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-brand-blue" disabled={loading}>
              {loading ? "Submitting..." : "Submit Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
