import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthCard } from "@/components/auth/auth-card";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  return (
    <AuthCard title="Reset Password" description="Enter the code and your new password">
      <ResetPasswordForm email={searchParams.email || ""} />
    </AuthCard>
  );
}
