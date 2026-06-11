import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS, type TaskStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant={status}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}
