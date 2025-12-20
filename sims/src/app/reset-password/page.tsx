/**
 * Reset Password Page
 *
 * Uses a placeholder token flow. In dev, use token: "dev-reset-token".
 */

"use client";

import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "../../components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username") ?? "";
  const token = searchParams.get("token") ?? "";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your reset token and new password.
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Dev token: "dev-reset-token"
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <ResetPasswordForm username={username} presetToken={token} />
        </div>
      </div>
    </div>
  );
}

