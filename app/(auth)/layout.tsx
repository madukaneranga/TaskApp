import { AppBrand } from "@/components/layout/app-brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-slate p-4 dark:bg-background">
      <div className="w-full max-w-md animate-fade-in">
        <AppBrand variant="auth" />
        {children}
      </div>
    </div>
  );
}
