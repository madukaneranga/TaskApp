import { Badge } from "@/components/ui/badge";
import { PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/types";

const STATUS_VARIANT: Record<
  ProblemStatus,
  "pending" | "in_progress" | "completed" | "secondary"
> = {
  open: "pending",
  in_progress: "in_progress",
  resolved: "completed",
  closed: "secondary",
};

export function ProblemStatusBadge({ status }: { status: ProblemStatus }) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {PROBLEM_STATUS_LABELS[status]}
    </Badge>
  );
}
