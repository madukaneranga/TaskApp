"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  WHATS_NEW_ITEMS,
  WHATS_NEW_VERSION,
  getWhatsNewStorageKey,
} from "@/lib/whats-new";

interface WhatsNewModalProps {
  userId: string;
}

export function WhatsNewModal({ userId }: WhatsNewModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (WHATS_NEW_ITEMS.length === 0) return;

    const storageKey = getWhatsNewStorageKey(userId);
    const seenVersion = localStorage.getItem(storageKey);

    if (seenVersion !== WHATS_NEW_VERSION) {
      setOpen(true);
    }
  }, [userId]);

  if (WHATS_NEW_ITEMS.length === 0) {
    return null;
  }

  function dismiss() {
    localStorage.setItem(getWhatsNewStorageKey(userId), WHATS_NEW_VERSION);
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      dismiss();
      return;
    }
    setOpen(true);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-blue" />
            What&apos;s New
          </DialogTitle>
          <DialogDescription>
            Here are the latest features and updates in Task Tracker.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-4">
          {WHATS_NEW_ITEMS.map((item) => (
            <li key={item.title} className="space-y-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button type="button" className="bg-brand-blue" onClick={dismiss}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
