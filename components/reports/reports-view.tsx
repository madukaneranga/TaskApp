"use client";

import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/tasks/status-badge";
import {
  exportReportPdf,
  exportTasksCsv,
  exportTasksExcel,
  exportUserSummaryCsv,
  exportUserSummaryExcel,
} from "@/lib/report-exports";
import type { ReportParams, ReportSummary, ReportTaskRow, ReportUserRow } from "@/lib/reports";
import { formatCompletedDuration } from "@/lib/task-utils";
import { formatDateTime } from "@/lib/utils";
import { TASK_STATUS_LABELS, type TaskStatus, type UserOption } from "@/lib/types";
import { getUserLabel } from "@/lib/user-utils";

interface ReportsViewProps {
  isAdmin: boolean;
  users: UserOption[];
  params: ReportParams;
  summary: ReportSummary;
  taskRows: ReportTaskRow[];
  userRows: ReportUserRow[];
  backlogRows: ReportTaskRow[];
}

function formatRangeLabel(params: ReportParams): string {
  const from = params.range.from.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const to = params.range.to.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${from} – ${to}`;
}

export function ReportsView({
  isAdmin,
  users,
  params,
  summary,
  taskRows,
  userRows,
  backlogRows,
}: ReportsViewProps) {
  const router = useRouter();
  const periodLabel = formatRangeLabel(params);

  function updateParams(updates: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const range = updates.range ?? params.range.preset;
    next.set("range", range);

    if (range === "custom") {
      const from =
        updates.from ?? params.range.from.toISOString().split("T")[0];
      const to = updates.to ?? params.range.to.toISOString().split("T")[0];
      next.set("from", from);
      next.set("to", to);
    }

    const user = updates.user !== undefined ? updates.user : params.userId;
    if (user) next.set("user", user);

    const status = updates.status ?? params.status;
    if (status !== "all") next.set("status", status);

    router.push(`/reports?${next.toString()}`);
  }

  const summaryCards = [
    { label: "Completed", value: summary.completed },
    { label: "In Progress", value: summary.inProgress },
    { label: "Paused", value: summary.paused },
    { label: "Pending", value: summary.pending },
    { label: "Hours", value: summary.totalHours },
    { label: "Images Done", value: `${summary.imagesEdited}/${summary.totalImages}` },
  ];

  const pdfSummary = [
    { label: "Completed", value: String(summary.completed) },
    { label: "In Progress", value: String(summary.inProgress) },
    { label: "Pending", value: String(summary.pending) },
    { label: "Total Hours", value: String(summary.totalHours) },
    { label: "Images Edited", value: String(summary.imagesEdited) },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>Date range</Label>
            <Select
              value={params.range.preset}
              onValueChange={(v) => updateParams({ range: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {params.range.preset === "custom" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  type="date"
                  defaultValue={params.range.from.toISOString().split("T")[0]}
                  onChange={(e) =>
                    updateParams({
                      range: "custom",
                      from: e.target.value,
                      to: params.range.to.toISOString().split("T")[0],
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="date"
                  defaultValue={params.range.to.toISOString().split("T")[0]}
                  onChange={(e) =>
                    updateParams({
                      range: "custom",
                      from: params.range.from.toISOString().split("T")[0],
                      to: e.target.value,
                    })
                  }
                />
              </div>
            </>
          )}

          {isAdmin && (
            <div className="space-y-2">
              <Label>User</Label>
              <Select
                value={params.userId || "all"}
                onValueChange={(v) => updateParams({ user: v === "all" ? undefined : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All users</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {getUserLabel(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={params.status}
              onValueChange={(v) => updateParams({ status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardContent className="border-t pt-4">
          <p className="text-sm text-muted-foreground">Showing data for {periodLabel}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {summary.completedByDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tasks Completed</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.completedByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#2563EB" name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {userRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No user activity in this period.</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead>In Progress</TableHead>
                    <TableHead>Paused</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Images Edited</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRows.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell className="font-medium">{row.userName}</TableCell>
                      <TableCell>{row.completed}</TableCell>
                      <TableCell>{row.inProgress}</TableCell>
                      <TableCell>{row.paused}</TableCell>
                      <TableCell>{row.pending}</TableCell>
                      <TableCell>{row.totalHours}</TableCell>
                      <TableCell>{row.imagesEdited}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && userRows.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hours by User</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="userName" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalHours" fill="#2563EB" name="Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Detail</CardTitle>
        </CardHeader>
        <CardContent>
          {taskRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks in this period.</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Start</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Work</TableHead>
                    <TableHead>Span</TableHead>
                    <TableHead>Images</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.taskId}</TableCell>
                      <TableCell>{row.taskName}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>{row.assignedTo}</TableCell>
                      <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                      <TableCell>{row.startTime ? formatDateTime(row.startTime) : "—"}</TableCell>
                      <TableCell>{row.endTime ? formatDateTime(row.endTime) : "—"}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCompletedDuration(row.durationSeconds)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {formatCompletedDuration(row.spanDurationSeconds)}
                      </TableCell>
                      <TableCell>
                        {row.editedImages != null
                          ? `${row.editedImages}/${row.totalImages}`
                          : row.totalImages}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Backlog</CardTitle>
        </CardHeader>
        <CardContent>
          {backlogRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending or paused tasks.</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Images</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backlogRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-sm">{row.taskId}</TableCell>
                      <TableCell>{row.taskName}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>{row.assignedTo}</TableCell>
                      <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                      <TableCell>{row.totalImages}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportTasksCsv(taskRows)}>
            <Download className="mr-2 h-4 w-4" />
            Tasks CSV
          </Button>
          <Button variant="outline" onClick={() => exportUserSummaryCsv(userRows)}>
            <Download className="mr-2 h-4 w-4" />
            User Summary CSV
          </Button>
          <Button variant="outline" onClick={() => exportTasksExcel(taskRows)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Tasks Excel
          </Button>
          <Button variant="outline" onClick={() => exportUserSummaryExcel(userRows)}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            User Summary Excel
          </Button>
          <Button
            className="bg-brand-blue"
            onClick={() =>
              exportReportPdf({
                title: isAdmin ? "Team Report" : "My Report",
                periodLabel,
                summary: pdfSummary,
                taskRows,
                userRows,
              })
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
