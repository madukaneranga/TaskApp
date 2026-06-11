/** User fields used for display in tasks, reports, and the UI. */
export type UserLabelSource = {
  user_code?: string | null;
  full_name?: string | null;
};

/** Primary label shown across the app (user code, not legal name). */
export function getUserLabel(user: UserLabelSource | null | undefined): string {
  if (!user) return "—";
  return user.user_code?.trim() || "—";
}
