/**
 * ChangePasswordForm Component
 * 
 * Form for changing user password.
 */

"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Loading from "../loading/Loading";

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * ChangePasswordForm - Form for changing password
 * 
 * @param onSuccess - Callback function called after successful password change
 * @param onCancel - Callback function called when user cancels
 * 
 * @example
 * ```tsx
 * <ChangePasswordForm 
 *   onSuccess={() => console.log("Password changed!")}
 *   onCancel={() => setEditing(false)}
 * />
 * ```
 */
export function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const currentUser = useCurrentUser();
  const changePasswordMutation = useMutation(api.auth.changePasswordWithUserId);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Validate form
  const validate = (): boolean => {
    const errors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (currentPassword === newPassword) {
      errors.newPassword = "New password must be different from current password";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validate() || !currentUser) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await changePasswordMutation({
        userId: currentUser._id,
        currentPassword,
        newPassword,
      });

      if (result.success) {
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError("Failed to change password. Please try again.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      if (errorMessage.includes("Current password is incorrect")) {
        setValidationErrors((prev) => ({
          ...prev,
          currentPassword: "Current password is incorrect",
        }));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Please log in to change your password.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password Field */}
        <div>
          <Label htmlFor="currentPassword" className="mb-2 block">
            Current Password *
          </Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (validationErrors.currentPassword) {
                setValidationErrors((prev) => ({ ...prev, currentPassword: undefined }));
              }
            }}
            placeholder="Enter your current password"
            error={!!validationErrors.currentPassword}
            hint={validationErrors.currentPassword}
            disabled={isLoading}
            autoComplete="current-password"
            required
          />
        </div>

        {/* New Password Field */}
        <div>
          <Label htmlFor="newPassword" className="mb-2 block">
            New Password *
          </Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (validationErrors.newPassword) {
                setValidationErrors((prev) => ({ ...prev, newPassword: undefined }));
              }
            }}
            placeholder="Enter your new password"
            error={!!validationErrors.newPassword}
            hint={validationErrors.newPassword}
            disabled={isLoading}
            autoComplete="new-password"
            required
          />
        </div>

        {/* Confirm Password Field */}
        <div>
          <Label htmlFor="confirmPassword" className="mb-2 block">
            Confirm New Password *
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (validationErrors.confirmPassword) {
                setValidationErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            placeholder="Confirm your new password"
            error={!!validationErrors.confirmPassword}
            hint={validationErrors.confirmPassword}
            disabled={isLoading}
            autoComplete="new-password"
            required
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loading />
                Changing...
              </span>
            ) : (
              "Change Password"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

