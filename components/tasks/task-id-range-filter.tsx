"use client";

import { useState } from "react";
import Link from "next/link";
import { ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/tasks/status-badge";
import { toastError } from "@/lib/toast-helpers";
import type { TaskIdRangeAuditResult } from "@/lib/task-id-range-audit";
import { MAX_TASK_ID_RANGE_SIZE } from "@/lib/task-id-range-audit";
import type { TaskStatus } from "@/lib/types";

const STATUS_ORDER: TaskStatus[] = ["pending", "in_progress", "paused", "completed"];

export function TaskIdRangeFilter() {
  const [open, setOpen] = useState(false);
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [exceptValue, setExceptValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState<TaskIdRangeAuditResult | null>(null);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setAudit(null);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setAudit(null);

    try {
      const params = new URLSearchParams({
        from: fromValue.trim(),
        to: toValue.trim(),
      });
      if (exceptValue.trim()) {
        params.set("except", exceptValue.trim());
      }
      const res = await fetch(`/api/admin/tasks/range-audit?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        toastError("Could not analyze range", data.error || "Please try again.");
        return;
      }

      setAudit(data as TaskIdRangeAuditResult);
    } catch {
      toastError("Could not analyze range", "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <ListOrdered className="mr-2 h-4 w-4" />
          Task ID Range
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task ID Range Check</DialogTitle>
          <DialogDescription>
            Enter a from and to task number to see which IDs exist, which are missing, and
            current status in that range. Optionally exclude specific IDs (max{" "}
            {MAX_TASK_ID_RANGE_SIZE} numbers).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="task-range-from">From task ID</Label>
            <Input
              id="task-range-from"
              inputMode="numeric"
              placeholder="e.g. 1000"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-range-to">To task ID</Label>
            <Input
              id="task-range-to"
              inputMode="numeric"
              placeholder="e.g. 1100"
              value={toValue}
              onChange={(e) => setToValue(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="task-range-except">Except IDs (optional)</Label>
          <Input
            id="task-range-except"
            placeholder="e.g. 1005, 1010, 1020"
            value={exceptValue}
            onChange={(e) => setExceptValue(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Comma or space separated. These numbers are skipped and not counted as missing.
          </p>
        </div>

        {audit && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <SummaryCard label="Range" value={`${audit.from} – ${audit.to}`} />
              <SummaryCard label="Total numbers" value={String(audit.totalInRange)} />
              <SummaryCard label="Except" value={String(audit.exceptCount)} />
              <SummaryCard label="Expected" value={String(audit.expectedCount)} />
              <SummaryCard label="Found" value={String(audit.foundCount)} />
              <SummaryCard
                label="Missing"
                value={String(audit.missingCount)}
                highlight={audit.missingCount > 0 ? "warning" : "success"}
              />
            </div>

            {audit.exceptCount > 0 && (
              <div className="rounded-lg border p-4">
                <h3 className="mb-2 text-sm font-semibold">Excluded task IDs</h3>
                <p className="font-mono text-sm leading-relaxed">
                  {audit.exceptGroups.join(", ")}
                </p>
              </div>
            )}

            <div className="rounded-lg border p-4">
              <h3 className="mb-3 text-sm font-semibold">Status breakdown</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
                  >
                    <StatusBadge status={status} />
                    <span className="font-mono font-medium">{audit.statusCounts[status]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <h3 className="mb-2 text-sm font-semibold">Missing task IDs</h3>
              {audit.missingCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Every expected task number in this range exists.
                </p>
              ) : (
                <p className="font-mono text-sm leading-relaxed">
                  {audit.missingGroups.join(", ")}
                </p>
              )}
            </div>

            <div className="rounded-lg border">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Tasks in range ({audit.foundCount})</h3>
              </div>
              {audit.tasks.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">No tasks found in this range.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                      <tr className="text-left">
                        <th className="px-4 py-2 font-medium">Task ID</th>
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">Assigned</th>
                        <th className="px-4 py-2 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {audit.tasks.map((task) => (
                        <tr
                          key={task.id}
                          className={task.excluded ? "border-t bg-muted/40" : "border-t"}
                        >
                          <td className="px-4 py-2 font-mono">
                            <div className="flex items-center gap-2">
                              {task.task_id}
                              {task.excluded && (
                                <Badge variant="outline" className="text-[10px]">
                                  Excluded
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">{task.task_name}</td>
                          <td className="px-4 py-2">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {task.assigned_user?.user_code || "—"}
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button variant="link" size="sm" className="h-auto p-0" asChild>
                              <Link href={`/tasks/${task.id}`}>View</Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleAnalyze} disabled={loading || !fromValue.trim() || !toValue.trim()}>
            {loading ? "Analyzing..." : "Analyze range"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "warning" | "success";
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          highlight === "warning"
            ? "text-lg font-semibold text-amber-700 dark:text-amber-300"
            : highlight === "success"
              ? "text-lg font-semibold text-green-700 dark:text-green-300"
              : "text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  );
}
