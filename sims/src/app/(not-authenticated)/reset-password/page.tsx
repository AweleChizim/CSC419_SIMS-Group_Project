"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "./_components/ResetPasswordForm";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  return (
    <AuthPageLayout
      title="Reset Password"
      description="Enter your reset token and new password."
      devNote='Dev token: "dev-reset-token"'
    >
      <ResetPasswordForm email={email} presetToken={token} />
    </AuthPageLayout>
  );
}

