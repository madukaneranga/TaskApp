import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { AuthCard } from "@/components/auth/auth-card";

export default function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  return (
    <AuthCard title="Verify Email" description="Enter the 6-digit code sent to your email">
      <VerifyEmailForm email={searchParams.email || ""} />
    </AuthCard>
  );
}
