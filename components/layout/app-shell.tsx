import { Sidebar } from "@/components/layout/sidebar";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import type { User } from "@/lib/types";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:block">
        <Sidebar role={user.role} userName={user.full_name} />
      </div>
      <div className="flex flex-1 flex-col">
        <MobileDrawer role={user.role} userName={user.full_name} />
        <main className="flex-1 animate-fade-in p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
