"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  BarChart3,
  LogOut,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppBrand } from "@/components/layout/app-brand";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toastSuccess } from "@/lib/toast-helpers";
import type { UserRole } from "@/lib/types";

interface SidebarProps {
  role: UserRole;
  userName: string;
  onNavigate?: () => void;
}

const userLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/tasks/new", label: "New Task", icon: PlusCircle },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/problems", label: "Report Problem", icon: AlertCircle },
];

const adminLinks = [
  { href: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/problems", label: "Problem Reports", icon: AlertCircle },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/tasks", label: "Tasks", icon: ClipboardList },
  { href: "/tasks/new", label: "New Task", icon: PlusCircle },
];

export function Sidebar({ role, userName, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const links = role === "admin" ? adminLinks : userLinks;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toastSuccess("Signed out");
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full min-h-screen w-[240px] shrink-0 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-4">
        <AppBrand variant="sidebar" />
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => {
          const Icon = link.icon;
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" &&
              link.href !== "/admin" &&
              pathname.startsWith(link.href + "/"));
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-opacity hover:opacity-80",
                active
                  ? "bg-brand-blue/10 text-brand-blue"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <Separator />
      <div className="p-3">
        <p className="truncate px-3 text-sm font-medium">{userName}</p>
        <p className="truncate px-3 text-xs text-muted-foreground capitalize">{role}</p>
      </div>
      <ThemeToggle />
      <div className="p-3">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
