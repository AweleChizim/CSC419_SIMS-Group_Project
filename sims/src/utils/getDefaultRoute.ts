/**
 * Get Default Route Utility
 * 
 * Determines the default route a user should be redirected to based on their roles.
 */

import { UserRole } from "../../convex/lib/aggregates/types";

/**
 * Get the default route for a user based on their roles
 * 
 * @param roles - Array of user roles
 * @returns The default route path for the user
 */
export function getDefaultRoute(roles: UserRole[]): string {
  // Priority order: admin > instructor > student > others
  if (roles.includes("admin")) {
    return "/profile"; // TODO: Change to "/dashboard/admin" when dashboard is created
  }
  
  if (roles.includes("instructor")) {
    return "/profile"; // TODO: Change to "/dashboard/instructor" when dashboard is created
  }
  
  if (roles.includes("student")) {
    return "/profile"; // TODO: Change to "/dashboard/student" when dashboard is created
  }
  
  // Default fallback
  return "/profile";
}

