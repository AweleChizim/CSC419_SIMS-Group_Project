/**
 * ResetPasswordForm Component
 *
 * Resets password using a reset token (placeholder flow).
 */

"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import Loading from "../loading/Loading";

interface ResetPasswordFormProps {
  username?: string;
  presetToken?: string;
}

export function ResetPasswordForm({ username = "", presetToken = "" }: ResetPasswordFormProps) {
  const resetPassword = useMutation(api.auth.resetPassword);
  const [formUsername, setFormUsername] = useState(username);
  const [resetToken, setResetToken] = useState(presetToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!formUsername.trim()) {
      setError("Username is required");
      return;
    }
    if (!resetToken.trim()) {
      setError("Reset token is required");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({
        username: formUsername,
        resetToken,
        newPassword,
      });
      setMessage("Password has been reset successfully. You can now log in.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="username" className="mb-2 block">
          Username
        </Label>
        <Input
          id="username"
          type="text"
          value={formUsername}
          onChange={(e) => setFormUsername(e.target.value)}
          placeholder="Enter your username"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="token" className="mb-2 block">
          Reset Token
        </Label>
        <Input
          id="token"
          type="text"
          value={resetToken}
          onChange={(e) => setResetToken(e.target.value)}
          placeholder="Enter reset token"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="newPassword" className="mb-2 block">
          New Password
        </Label>
        <Input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
          disabled={isLoading}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword" className="mb-2 block">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          disabled={isLoading}
        />
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {message && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
        </div>
      )}

      <Button type="submit" variant="primary" size="full" disabled={isLoading}>
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loading />
            Resetting...
          </span>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );
}

