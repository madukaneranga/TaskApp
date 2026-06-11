import type { SessionSegment } from "@/lib/types";

export function computeSegmentDurationSeconds(
  segment: Pick<SessionSegment, "started_at" | "ended_at">,
  now = Date.now()
): number {
  const start = new Date(segment.started_at).getTime();
  const end = segment.ended_at ? new Date(segment.ended_at).getTime() : now;
  return Math.max(0, Math.floor((end - start) / 1000));
}

export function calculateWorkDuration(segments: SessionSegment[]): number {
  let total = 0;
  const now = Date.now();

  for (const seg of segments) {
    if (seg.type !== "work") continue;
    const start = new Date(seg.started_at).getTime();
    const end = seg.ended_at ? new Date(seg.ended_at).getTime() : now;
    total += Math.max(0, Math.floor((end - start) / 1000));
  }

  return total;
}

export function isSessionActive(segments: SessionSegment[]): {
  active: boolean;
  isPaused: boolean;
  activeSegmentStart: string | null;
} {
  const openSegment = segments.find((s) => !s.ended_at);
  if (!openSegment) {
    return { active: false, isPaused: false, activeSegmentStart: null };
  }
  return {
    active: true,
    isPaused: openSegment.type === "pause",
    activeSegmentStart: openSegment.type === "work" ? openSegment.started_at : null,
  };
}
