/**
 * Profile Page
 * 
 * User profile management page with profile update and password change forms.
 */

"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ProfileUpdateForm } from "./_components/ProfileUpdateForm";
import { ChangePasswordForm } from "./_components/ChangePasswordForm";
import Alert from "@/components/ui/alert/Alert";

export default function ProfilePage() {
  const user = useCurrentUser();
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Profile
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your profile information and account settings
            </p>
          </div>

          {/* Success Message */}
          {showSuccessMessage && (
            <div className="mb-6">
              <Alert variant="success" title="Success" message="Profile updated successfully!" />
            </div>
          )}

          {/* User Info Card */}
          {user && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Account Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user.profile.firstName} {user.profile.middleName} {user.profile.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Roles</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {user.roles.join(", ")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "profile"
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab("password")}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "password"
                      ? "border-brand-500 text-brand-600 dark:text-brand-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  Change Password
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Update Profile
                  </h2>
                  <ProfileUpdateForm onSuccess={handleSuccess} />
                </div>
              )}

              {activeTab === "password" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Change Password
                  </h2>
                  <ChangePasswordForm onSuccess={handleSuccess} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

