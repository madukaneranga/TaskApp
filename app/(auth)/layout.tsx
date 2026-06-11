import { AppBrand } from "@/components/layout/app-brand";
import { AppFooter } from "@/components/layout/app-footer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-slate dark:bg-background">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">
          <AppBrand variant="auth" />
          {children}
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
