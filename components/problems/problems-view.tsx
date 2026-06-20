"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProblemStatusBadge } from "@/components/problems/problem-status-badge";
import { formatDateTime } from "@/lib/utils";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import { formatProblemReported } from "@/lib/verbal-format";
import {
  PROBLEM_STATUS_LABELS,
  type ProblemReport,
  type ProblemStatus,
} from "@/lib/types";

interface ProblemsViewProps {
  reports: ProblemReport[];
  isAdmin: boolean;
}

export function ProblemsView({ reports, isAdmin }: ProblemsViewProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);

    const res = await fetch("/api/problems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toastError("Could not submit report", data.error || "Please try again.");
      return;
    }

    toastSuccess("Problem reported");
    setTitle("");
    setDescription("");
    router.refresh();
  }

  async function handleStatusChange(reportId: string, status: ProblemStatus) {
    setUpdatingId(reportId);

    const res = await fetch("/api/admin/problems", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id: reportId, status }),
    });

    setUpdatingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toastError("Could not update status", data.error || "Please try again.");
      return;
    }

    toastSuccess("Status updated");
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report a Problem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What happened? Include steps to reproduce if possible."
                rows={4}
              />
            </div>
            <Button
              type="submit"
              className="bg-brand-blue"
              disabled={submitting || !title.trim() || !description.trim()}
            >
              {submitting ? "Submitting..." : "Submit Report"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {isAdmin ? "All Reports" : "Your Reports"}
        </h2>

        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reports yet.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-medium">{report.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(report.created_at)}
                        {isAdmin && report.user && (
                          <> · {formatProblemReported(report.user)}</>
                        )}
                      </p>
                    </div>
                    {isAdmin ? (
                      <Select
                        value={report.status}
                        onValueChange={(value) =>
                          handleStatusChange(report.id, value as ProblemStatus)
                        }
                        disabled={updatingId === report.id}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PROBLEM_STATUS_LABELS) as ProblemStatus[]).map(
                            (status) => (
                              <SelectItem key={status} value={status}>
                                {PROBLEM_STATUS_LABELS[status]}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <ProblemStatusBadge status={report.status} />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {report.description}
                  </p>
                  {report.admin_response && (
                    <div className="rounded-md border bg-muted/50 p-3 text-sm">
                      <p className="font-medium text-xs text-muted-foreground mb-1">
                        Admin response
                      </p>
                      <p className="whitespace-pre-wrap">{report.admin_response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
