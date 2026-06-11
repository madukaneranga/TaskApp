"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import type { UserRole } from "@/lib/types";

interface MobileDrawerProps {
  role: UserRole;
  userName: string;
}

export function MobileDrawer({ role, userName }: MobileDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex h-14 items-center border-b px-4 lg:hidden">
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-3 font-semibold text-brand-navy dark:text-foreground">Task Tracker</span>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full animate-slide-in-left">
            <div className="relative h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
              <Sidebar role={role} userName={userName} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
