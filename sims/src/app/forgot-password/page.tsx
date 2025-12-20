/**
 * Forgot Password Page
 */

"use client";

import { ForgotPasswordForm } from "../../components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your username to request a reset link.
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            Dev token: you will receive a placeholder token for testing.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}

