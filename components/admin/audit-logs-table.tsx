"use client";

import { Suspense, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LocalDateTime } from "@/components/ui/local-date";
import { Pagination } from "@/components/ui/pagination";
import {
  AUDIT_OPERATION_LABELS,
  getAuditTableLabel,
  type AuditLogEntry,
} from "@/lib/audit-logs";
import type { PaginationMeta } from "@/lib/pagination";

interface AuditLogsTableProps {
  logs: AuditLogEntry[];
  actorByUserId: Record<string, string>;
  pagination: PaginationMeta;
}

function operationVariant(operation: AuditLogEntry["operation"]) {
  switch (operation) {
    case "INSERT":
      return "default" as const;
    case "UPDATE":
      return "secondary" as const;
    case "DELETE":
      return "destructive" as const;
  }
}

function formatJson(data: AuditLogEntry["old_data"]): string {
  if (data === null || data === undefined) return "—";
  return JSON.stringify(data, null, 2);
}

export function AuditLogsTable({ logs, actorByUserId, pagination }: AuditLogsTableProps) {
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        No audit log entries match your filters.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Record</TableHead>
              <TableHead>Changed fields</TableHead>
              <TableHead className="text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  <LocalDateTime value={log.created_at} />
                </TableCell>
                <TableCell>{getAuditTableLabel(log.table_name)}</TableCell>
                <TableCell>
                  <Badge variant={operationVariant(log.operation)}>
                    {AUDIT_OPERATION_LABELS[log.operation]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {log.user_id
                    ? actorByUserId[log.user_id] ?? log.user_id.slice(0, 8)
                    : "System"}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.record_id.slice(0, 8)}…
                </TableCell>
                <TableCell className="max-w-[220px]">
                  {log.changed_fields?.length ? (
                    <span className="line-clamp-2 text-xs text-muted-foreground">
                      {log.changed_fields.join(", ")}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(log)}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Suspense fallback={null}>
        <Pagination pagination={pagination} />
      </Suspense>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit log details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Table</dt>
                  <dd className="font-medium">{getAuditTableLabel(selected.table_name)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Action</dt>
                  <dd>
                    <Badge variant={operationVariant(selected.operation)}>
                      {AUDIT_OPERATION_LABELS[selected.operation]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">User</dt>
                  <dd className="font-medium">
                    {selected.user_id
                      ? actorByUserId[selected.user_id] ?? selected.user_id
                      : "System"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">When</dt>
                  <dd>
                    <LocalDateTime value={selected.created_at} />
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Record ID</dt>
                  <dd className="font-mono text-xs break-all">{selected.record_id}</dd>
                </div>
                {selected.changed_fields?.length ? (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Changed fields</dt>
                    <dd>{selected.changed_fields.join(", ")}</dd>
                  </div>
                ) : null}
              </dl>

              {selected.old_data !== null && (
                <div>
                  <p className="mb-2 font-medium">Before</p>
                  <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {formatJson(selected.old_data)}
                  </pre>
                </div>
              )}

              {selected.new_data !== null && (
                <div>
                  <p className="mb-2 font-medium">After</p>
                  <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {formatJson(selected.new_data)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
