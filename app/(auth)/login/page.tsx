import { LoginForm } from "@/components/auth/login-form";
import { AuthCard } from "@/components/auth/auth-card";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  const message =
    searchParams.message === "pending"
      ? "Your account is awaiting admin approval."
      : searchParams.message === "rejected"
        ? "Your account was not approved. Contact admin."
        : undefined;

  return (
    <AuthCard title="Sign In" description="Sign in with your personal email and password">
      <LoginForm initialMessage={message} />
    </AuthCard>
  );
}
