/**
 * ResetPasswordForm Component
 *
 * Resets password using a reset token (placeholder flow).
 */

"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import Loading from "@/components/loading/Loading";
import { EyeCloseIcon, EyeIcon } from "@/icons";

interface ResetPasswordFormProps {
  email?: string;
  presetToken?: string;
}

export function ResetPasswordForm({ email = "", presetToken = "" }: ResetPasswordFormProps) {
  const resetPassword = useMutation(api.auth.resetPassword);
  const [formEmail, setFormEmail] = useState(email);
  const [resetToken, setResetToken] = useState(presetToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    resetToken?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const handleInputChange = (
    field: "email" | "resetToken" | "newPassword" | "confirmPassword",
    value: string
  ) => {
    if (field === "email") {
      setFormEmail(value);
    } else if (field === "resetToken") {
      setResetToken(value);
    } else if (field === "newPassword") {
      setNewPassword(value);
    } else {
      setConfirmPassword(value);
    }

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);
    setApiMessage(null);
    setValidationErrors({});

    const errors: {
      email?: string;
      resetToken?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!formEmail.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      errors.email = "Please enter a valid email address";
    }
    if (!resetToken.trim()) {
      errors.resetToken = "Reset token is required";
    }
    if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword({
        username: formEmail,
        resetToken,
        newPassword,
      });
      setApiMessage("Password has been reset successfully. You can now log in.");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred. Please try again.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {apiError && (
          <div className="mb-6">
            <Alert variant="error" title="Error" message={apiError} />
          </div>
        )}

        {apiMessage && (
          <div className="mb-6">
            <Alert variant="success" title="Success" message={apiMessage} />
          </div>
        )}

        <div>
          <Label>
            Email <span className="text-error-500">*</span>
          </Label>
          <Input
            id="email"
            placeholder="Enter your email"
            type="email"
            value={formEmail}
            onChange={(e) => handleInputChange("email", e.target.value)}
            error={!!validationErrors.email}
            disabled={isLoading}
            autoComplete="email"
          />
          {validationErrors.email && (
            <p className="text-error-500 mt-1 text-sm">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <Label>
            Reset Token <span className="text-error-500">*</span>
          </Label>
          <Input
            id="token"
            placeholder="Enter reset token"
            type="text"
            value={resetToken}
            onChange={(e) => handleInputChange("resetToken", e.target.value)}
            error={!!validationErrors.resetToken}
            disabled={isLoading}
          />
          {validationErrors.resetToken && (
            <p className="text-error-500 mt-1 text-sm">{validationErrors.resetToken}</p>
          )}
        </div>

        <div>
          <Label>
            New Password <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              error={!!validationErrors.newPassword}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <span
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
            >
              {showNewPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
              )}
            </span>
          </div>
          {validationErrors.newPassword && (
            <p className="text-error-500 mt-1 text-sm">{validationErrors.newPassword}</p>
          )}
        </div>

        <div>
          <Label>
            Confirm Password <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
              error={!!validationErrors.confirmPassword}
              disabled={isLoading}
              autoComplete="new-password"
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute top-1/2 right-4 z-30 -translate-y-1/2 cursor-pointer"
            >
              {showConfirmPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
              )}
            </span>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-error-500 mt-1 text-sm">{validationErrors.confirmPassword}</p>
          )}
        </div>

        <div>
          <Button type="submit" className="w-full" disabled={isLoading} size="full">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loading />
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

