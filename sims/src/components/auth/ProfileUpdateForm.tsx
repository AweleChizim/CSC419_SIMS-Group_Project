/**
 * ProfileUpdateForm Component
 * 
 * Form for updating user profile information (name fields).
 */

"use client";

import { useState, FormEvent, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Loading from "../loading/Loading";

interface ProfileUpdateFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * ProfileUpdateForm - Form for updating user profile
 * 
 * @param onSuccess - Callback function called after successful update
 * @param onCancel - Callback function called when user cancels
 * 
 * @example
 * ```tsx
 * <ProfileUpdateForm 
 *   onSuccess={() => console.log("Profile updated!")}
 *   onCancel={() => setEditing(false)}
 * />
 * ```
 */
export function ProfileUpdateForm({ onSuccess, onCancel }: ProfileUpdateFormProps) {
  const currentUser = useCurrentUser();
  const updateProfileMutation = useMutation(api.users.updateProfile);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    firstName?: string;
    lastName?: string;
  }>({});

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.profile.firstName || "");
      setMiddleName(currentUser.profile.middleName || "");
      setLastName(currentUser.profile.lastName || "");
    }
  }, [currentUser]);

  // Validate form
  const validate = (): boolean => {
    const errors: { firstName?: string; lastName?: string } = {};

    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
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
      const result = await updateProfileMutation({
        userId: currentUser._id,
        profile: {
          firstName: firstName.trim(),
          middleName: middleName.trim() || undefined,
          lastName: lastName.trim(),
        },
      });

      if (result.success) {
        // Call success callback
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Please log in to update your profile.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* First Name Field */}
        <div>
          <Label htmlFor="firstName" className="mb-2 block">
            First Name *
          </Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (validationErrors.firstName) {
                setValidationErrors((prev) => ({ ...prev, firstName: undefined }));
              }
            }}
            placeholder="Enter your first name"
            error={!!validationErrors.firstName}
            hint={validationErrors.firstName}
            disabled={isLoading}
            required
          />
        </div>

        {/* Middle Name Field */}
        <div>
          <Label htmlFor="middleName" className="mb-2 block">
            Middle Name
          </Label>
          <Input
            id="middleName"
            type="text"
            value={middleName}
            onChange={(e) => setMiddleName(e.target.value)}
            placeholder="Enter your middle name (optional)"
            disabled={isLoading}
          />
        </div>

        {/* Last Name Field */}
        <div>
          <Label htmlFor="lastName" className="mb-2 block">
            Last Name *
          </Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (validationErrors.lastName) {
                setValidationErrors((prev) => ({ ...prev, lastName: undefined }));
              }
            }}
            placeholder="Enter your last name"
            error={!!validationErrors.lastName}
            hint={validationErrors.lastName}
            disabled={isLoading}
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
                Updating...
              </span>
            ) : (
              "Update Profile"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

