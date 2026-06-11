"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/ui/pagination";
import { toastError, toastSuccess } from "@/lib/toast-helpers";
import type { PaginationMeta } from "@/lib/pagination";
import { USER_STATUS_LABELS, type User, type UserStatus } from "@/lib/types";

const ACTION_MESSAGES: Record<string, string> = {
  approve: "User approved",
  reject: "User rejected",
  deactivate: "User deactivated",
  change_role: "Role updated",
  reset_password: "Password reset",
};

interface UsersTableProps {
  users: User[];
  pagination?: PaginationMeta;
}

export function UsersTable({ users, pagination }: UsersTableProps) {
  const router = useRouter();
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function closeResetDialog() {
    setResetUser(null);
    setNewPassword("");
    setConfirmPassword("");
  }

  async function performAction(
    userId: string,
    action: string,
    extra?: Record<string, string>
  ) {
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, action, ...extra }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toastError("Action failed", data.error || "Please try again.");
      return;
    }

    toastSuccess(ACTION_MESSAGES[action] || "Updated");
    router.refresh();
  }

  async function handleResetPassword() {
    if (!resetUser || !newPassword) return;
    if (newPassword !== confirmPassword) {
      toastError("Passwords do not match", "Please make sure both passwords are the same.");
      return;
    }
    await performAction(resetUser.id, "reset_password", { new_password: newPassword });
    closeResetDialog();
  }

  return (
    <>
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>
                  <Badge variant={user.status as UserStatus}>
                    {USER_STATUS_LABELS[user.status]}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-brand-blue"
                          disabled={loading}
                          onClick={() => performAction(user.id, "approve")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={loading}
                          onClick={() => performAction(user.id, "reject")}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    {user.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => performAction(user.id, "deactivate")}
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loading}
                      onClick={() => setResetUser(user)}
                    >
                      Reset Password
                    </Button>
                    <Select
                      value={user.role}
                      onValueChange={(role) =>
                        performAction(user.id, "change_role", { role })
                      }
                    >
                      <SelectTrigger className="h-8 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="rounded-lg border p-4 space-y-3">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{user.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant={user.status as UserStatus}>
                {USER_STATUS_LABELS[user.status]}
              </Badge>
            </div>
            <p className="text-sm capitalize">{user.role} • Joined {formatDate(user.created_at)}</p>
            <div className="flex flex-wrap gap-2">
              {user.status === "pending" && (
                <>
                  <Button size="sm" className="bg-brand-blue" onClick={() => performAction(user.id, "approve")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => performAction(user.id, "reject")}>
                    Reject
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => setResetUser(user)}>
                Reset Password
              </Button>
            </div>
          </div>
        ))}
      </div>

      {pagination && (
        <Suspense fallback={null}>
          <Pagination pagination={pagination} />
        </Suspense>
      )}

      <Dialog open={!!resetUser} onOpenChange={(open) => !open && closeResetDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {resetUser?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeResetDialog}>Cancel</Button>
            <Button
              className="bg-brand-blue"
              onClick={handleResetPassword}
              disabled={!newPassword || !confirmPassword}
            >
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
