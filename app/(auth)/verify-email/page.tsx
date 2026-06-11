import { redirect } from "next/navigation";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { AuthCard } from "@/components/auth/auth-card";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email?.toLowerCase().trim();
  if (email) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profile) {
      const { data: authUser } = await admin.auth.admin.getUserById(profile.id);
      if (authUser.user?.email_confirmed_at) {
        redirect("/login");
      }
    }
  }

  return (
    <AuthCard title="Verify Email" description="Enter the 6-digit code sent to your email">
      <VerifyEmailForm email={searchParams.email || ""} />
    </AuthCard>
  );
}
