import { SignupForm } from "@/components/auth/signup-form";
import { AuthCard } from "@/components/auth/auth-card";

export default function SignupPage() {
  return (
    <AuthCard title="Create Account" description="Register to join the team">
      <SignupForm />
    </AuthCard>
  );
}
