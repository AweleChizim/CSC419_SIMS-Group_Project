/**
 * ForgotPasswordForm Component
 *
 * Requests a password reset. Uses a placeholder reset flow.
 */

"use client";

import { useState, FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import Loading from "../loading/Loading";

export function ForgotPasswordForm() {
  const requestReset = useMutation(api.auth.requestPasswordReset);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestReset({ username });
      setMessage(res?.message ?? "If the account exists, reset instructions were sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to request password reset");
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
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username"
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
            Sending...
          </span>
        ) : (
          "Send Reset Link"
        )}
      </Button>
    </form>
  );
}

