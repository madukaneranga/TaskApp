"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUDITED_TABLES,
  AUDIT_OPERATIONS,
  AUDITED_TABLE_LABELS,
  AUDIT_OPERATION_LABELS,
  type AuditLogsFilterParams,
} from "@/lib/audit-logs";
import type { UserOption } from "@/lib/types";
import { getUserLabel } from "@/lib/user-utils";

interface AuditLogsFiltersProps {
  filters: AuditLogsFilterParams;
  users: UserOption[];
}

export function AuditLogsFilters({ filters, users }: AuditLogsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(updates: Partial<AuditLogsFilterParams>) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    const table = updates.table ?? filters.table;
    if (table === "all") {
      params.delete("table");
    } else {
      params.set("table", table);
    }

    const operation = updates.operation ?? filters.operation;
    if (operation === "all") {
      params.delete("operation");
    } else {
      params.set("operation", operation);
    }

    const userId = updates.userId !== undefined ? updates.userId : filters.userId;
    if (userId) {
      params.set("user", userId);
    } else {
      params.delete("user");
    }

    const qs = params.toString();
    router.push(qs ? `/admin/audit-logs?${qs}` : "/admin/audit-logs");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Table</Label>
          <Select
            value={filters.table}
            onValueChange={(value) =>
              updateParams({ table: value as AuditLogsFilterParams["table"] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {AUDITED_TABLES.map((table) => (
                <SelectItem key={table} value={table}>
                  {AUDITED_TABLE_LABELS[table]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>User</Label>
          <Select
            value={filters.userId || "all"}
            onValueChange={(value) =>
              updateParams({ userId: value === "all" ? null : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              <SelectItem value="system">System (no user)</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {getUserLabel(user)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Action</Label>
          <Select
            value={filters.operation}
            onValueChange={(value) =>
              updateParams({ operation: value as AuditLogsFilterParams["operation"] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {AUDIT_OPERATIONS.map((operation) => (
                <SelectItem key={operation} value={operation}>
                  {AUDIT_OPERATION_LABELS[operation]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
