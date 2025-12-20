/**
 * RoleGuard Component
 * 
 * Wrapper component that protects routes based on user roles.
 * Only renders children if the user has the required role(s).
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { useHasRole, useHasAnyRole, useHasAllRoles } from "../../hooks/useHasRole";
import { UserRole } from "../../../convex/_generated/api";
import Loading from "../loading/Loading";

interface RoleGuardProps {
  children: React.ReactNode;
  role?: UserRole;
  roles?: UserRole[];
  requireAll?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
  unauthorizedMessage?: string;
}

/**
 * RoleGuard - Protects routes based on user roles
 * 
 * @param children - The content to render if user has required role(s)
 * @param role - Single role to check (alternative to roles)
 * @param roles - Array of roles to check
 * @param requireAll - If true, user must have all roles. If false, user needs any role (default: false)
 * @param redirectTo - The path to redirect to if unauthorized (default: "/unauthorized")
 * @param fallback - Optional loading component to show while checking authentication
 * @param unauthorizedMessage - Optional message to show instead of redirecting
 * 
 * @example
 * ```tsx
 * // Single role check
 * <RoleGuard role="admin">
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * // Multiple roles (any)
 * <RoleGuard roles={["instructor", "admin"]}>
 *   <FacultyPanel />
 * </RoleGuard>
 * 
 * // Multiple roles (all required)
 * <RoleGuard roles={["admin", "registrar"]} requireAll>
 *   <SuperAdminPanel />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  children,
  role,
  roles,
  requireAll = false,
  redirectTo = "/unauthorized",
  fallback,
  unauthorizedMessage,
}: RoleGuardProps) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Determine which role check to use
  const hasSingleRole = role ? useHasRole(role) : false;
  const hasMultipleRoles = roles
    ? requireAll
      ? useHasAllRoles(roles)
      : useHasAnyRole(roles)
    : false;

  const hasAccess = hasSingleRole || hasMultipleRoles;

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess) {
      if (unauthorizedMessage) {
        // Don't redirect if showing a message
        return;
      }
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, hasAccess, router, redirectTo, unauthorizedMessage]);

  // Show loading state while checking authentication
  if (isLoading) {
    return fallback ?? <Loading />;
  }

  // Show unauthorized message or nothing while redirecting
  if (!isAuthenticated || !hasAccess) {
    if (unauthorizedMessage) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4 dark:text-red-400">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">{unauthorizedMessage}</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Render protected content
  return <>{children}</>;
}

