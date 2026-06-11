"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toastError, toastSuccess } from "@/lib/toast-helpers";

interface ForcePauseButtonProps {
  sessionId: string;
}

export function ForcePauseButton({ sessionId }: ForcePauseButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleForcePause() {
    setLoading(true);
    const res = await fetch("/api/sessions/pause", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, remark, force: true }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toastError("Force pause failed", data.error || "Please try again.");
      return;
    }

    toastSuccess("Task force paused");
    setOpen(false);
    setRemark("");
    router.refresh();
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        Force Pause
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Force Pause Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="remark">Remark (required)</Label>
            <Textarea
              id="remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Reason for force pausing..."
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleForcePause}
              disabled={loading || !remark.trim()}
            >
              Force Pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
