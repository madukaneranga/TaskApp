export const WHATS_NEW_VERSION = "2025-06-18";

export interface WhatsNewItem {
  title: string;
  description: string;
}

export const WHATS_NEW_ITEMS: WhatsNewItem[] = [
  {
    title: "Task name dropdown",
    description:
      "Choose from standardized task types (GREEN, RED PDR, RED DA, ORANGE PDR, and more) when creating or editing tasks.",
  },
 
];

export function getWhatsNewStorageKey(userId: string): string {
  return `taskapp-whats-new-seen:${userId}`;
}
