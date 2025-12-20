/**
 * LoginForm Component
 * 
 * Login form with role-based selection and validation.
 * Supports student, instructor, and admin role selection.
 */

"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Loading from "../loading/Loading";

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
}


/**
 * LoginForm - Login form with role-based access
 * 
 * @param onSuccess - Callback function called after successful login
 * @param redirectTo - Path to redirect to after login (default: role-based redirect)
 * 
 * @example
 * ```tsx
 * <LoginForm 
 *   onSuccess={() => console.log("Logged in!")}
 *   redirectTo="/dashboard"
 * />
 * ```
 */
export function LoginForm({ onSuccess, redirectTo }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    password?: string;
  }>({});

  const { login } = useAuth();
  const router = useRouter();

  // Validate form
  const validate = (): boolean => {
    const errors: { username?: string; password?: string } = {};

    if (!username.trim()) {
      errors.username = "Username is required";
    } else if (username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        // Determine redirect path based on returned user roles or provided redirectTo
        let redirectPath = redirectTo;

        const userRoles = result.user?.roles ?? [];

        if (!redirectPath) {
          if (userRoles.includes("admin")) {
            redirectPath = "/dashboard/admin";
          } else if (userRoles.includes("instructor")) {
            redirectPath = "/dashboard/instructor";
          } else if (userRoles.includes("student")) {
            redirectPath = "/dashboard/student";
          } else {
            redirectPath = "/dashboard";
          }
        }

        // Call success callback
        if (onSuccess) {
          onSuccess();
        }

        // Redirect
        router.push(redirectPath);
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Field */}
        <div>
          <Label htmlFor="username" className="mb-2 block">
            Username
          </Label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (validationErrors.username) {
                setValidationErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
            placeholder="Enter your username"
            error={!!validationErrors.username}
            hint={validationErrors.username}
            disabled={isLoading}
            autoComplete="username"
          />
        </div>

        {/* Password Field */}
        <div>
          <Label htmlFor="password" className="mb-2 block">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (validationErrors.password) {
                setValidationErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            placeholder="Enter your password"
            error={!!validationErrors.password}
            hint={validationErrors.password}
            disabled={isLoading}
            autoComplete="current-password"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="full"
          disabled={isLoading}
          className="mt-6"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loading />
              Logging in...
            </span>
          ) : (
            "Log In"
          )}
        </Button>

        {/* Forgot Password Link */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
            disabled={isLoading}
          >
            Forgot your password?
          </button>
        </div>
      </form>
    </div>
  );
}

