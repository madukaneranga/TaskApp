import { AppFooter } from "@/components/layout/app-footer";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { WhatsNewModal } from "@/components/layout/whats-new-modal";
import type { User } from "@/lib/types";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <WhatsNewModal userId={user.id} />
      <div className="hidden shrink-0 lg:sticky lg:top-0 lg:block lg:h-screen">
        <Sidebar role={user.role} userName={user.user_code} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <MobileDrawer role={user.role} userName={user.user_code} />
        <main className="flex-1 animate-fade-in p-4 md:p-6">{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
