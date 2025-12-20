/**
 * useHasRole Hook
 * 
 * Provides role-based access control checks.
 * Includes hooks for checking single roles, multiple roles, and permissions.
 */

import { useAuth } from "./useAuth";
import { UserRole } from "../../convex/_generated/api";

/**
 * Check if the current user has a specific role
 * 
 * @param role - The role to check for
 * @returns true if the user has the role, false otherwise
 * 
 * @example
 * ```tsx
 * function AdminPanel() {
 *   const isAdmin = useHasRole("admin");
 *   
 *   if (!isAdmin) {
 *     return <div>Access denied</div>;
 *   }
 *   
 *   return <div>Admin Panel</div>;
 * }
 * ```
 */
export function useHasRole(role: UserRole): boolean {
  const { hasRole } = useAuth();
  return hasRole(role);
}

/**
 * Check if the current user has any of the specified roles
 * 
 * @param roles - Array of roles to check
 * @returns true if the user has at least one of the roles, false otherwise
 * 
 * @example
 * ```tsx
 * function FacultyOrAdminPanel() {
 *   const hasAccess = useHasAnyRole(["instructor", "admin"]);
 *   
 *   if (!hasAccess) {
 *     return <div>Access denied</div>;
 *   }
 *   
 *   return <div>Faculty/Admin Panel</div>;
 * }
 * ```
 */
export function useHasAnyRole(roles: UserRole[]): boolean {
  const { hasAnyRole } = useAuth();
  return hasAnyRole(roles);
}

/**
 * Check if the current user has all of the specified roles
 * 
 * @param roles - Array of roles to check
 * @returns true if the user has all of the roles, false otherwise
 * 
 * @example
 * ```tsx
 * function SuperAdminPanel() {
 *   const isSuperAdmin = useHasAllRoles(["admin", "registrar"]);
 *   
 *   if (!isSuperAdmin) {
 *     return <div>Access denied</div>;
 *   }
 *   
 *   return <div>Super Admin Panel</div>;
 * }
 * ```
 */
export function useHasAllRoles(roles: UserRole[]): boolean {
  const { hasAllRoles } = useAuth();
  return hasAllRoles(roles);
}

/**
 * Hook for checking permissions (alias for role checking)
 * 
 * @param permission - The permission/role to check for
 * @returns true if the user has the permission, false otherwise
 */
export function usePermissions(permission: UserRole): boolean {
  return useHasRole(permission);
}

