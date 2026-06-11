import { Badge } from "@/components/ui/badge";
import { LocalDateTime } from "@/components/ui/local-date";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computeSegmentDurationSeconds } from "@/lib/session-utils";
import { formatDuration } from "@/lib/utils";
import type { SegmentType, SessionSegment } from "@/lib/types";
import { getUserLabel } from "@/lib/user-utils";

export interface SegmentLogRow {
  id: string;
  userName: string;
  sessionStart: string;
  type: SegmentType;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
}

const SEGMENT_TYPE_LABELS: Record<SegmentType, string> = {
  work: "Work",
  pause: "Pause",
};

type SessionWithSegments = {
  id: string;
  start_time: string;
  user?: { user_code: string } | { user_code: string }[] | null;
  session_segments?: SessionSegment[];
};

function resolveSessionUser(
  user: SessionWithSegments["user"]
): { user_code: string } | null {
  if (!user) return null;
  return Array.isArray(user) ? user[0] ?? null : user;
}

export function buildSegmentLogRows(sessions: SessionWithSegments[]): SegmentLogRow[] {
  const rows: SegmentLogRow[] = [];

  for (const session of sessions) {
    const segments = [...(session.session_segments || [])].sort(
      (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()
    );

    for (const segment of segments) {
      rows.push({
        id: segment.id,
        userName: getUserLabel(resolveSessionUser(session.user)),
        sessionStart: session.start_time,
        type: segment.type,
        startedAt: segment.started_at,
        endedAt: segment.ended_at,
        durationSeconds: computeSegmentDurationSeconds(segment),
      });
    }
  }

  return rows.sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );
}

function SegmentTypeBadge({ type }: { type: SegmentType }) {
  return (
    <Badge variant={type === "work" ? "default" : "secondary"}>
      {SEGMENT_TYPE_LABELS[type]}
    </Badge>
  );
}

export function SegmentLog({ rows }: { rows: SegmentLogRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No segments recorded.</p>;
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Session</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Started</TableHead>
            <TableHead>Ended</TableHead>
            <TableHead>Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.userName}</TableCell>
              <TableCell>
                <LocalDateTime value={row.sessionStart} />
              </TableCell>
              <TableCell>
                <SegmentTypeBadge type={row.type} />
              </TableCell>
              <TableCell>
                <LocalDateTime value={row.startedAt} />
              </TableCell>
              <TableCell>
                {row.endedAt ? <LocalDateTime value={row.endedAt} /> : "—"}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatDuration(row.durationSeconds)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
