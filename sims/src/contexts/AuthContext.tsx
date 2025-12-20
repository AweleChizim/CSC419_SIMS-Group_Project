/**
 * Authentication Context
 * 
 * Provides authentication state and methods throughout the application.
 * Manages user session, login, logout, and authentication status.
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { UserRole } from "../../convex/_generated/api";

export interface User {
  _id: Id<"users">;
  email: string;
  roles: UserRole[];
  profile: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
}

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  
  // Authentication methods
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    roles: string[];
    profile: {
      firstName: string;
      middleName?: string;
      lastName: string;
    };
  }) => Promise<{ success: boolean; error?: string }>;
  
  // Role checking
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [storedUserId, setStoredUserId] = useState<Id<"users"> | null>(null);

  // Get stored user ID from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem("sims_user_id") as Id<"users"> | null;
      if (userId) {
        setStoredUserId(userId);
      }
    }
  }, []);

  // Query current user with stored user ID
  const currentUser = useQuery(
    api.auth.getCurrentUser,
    storedUserId ? { userId: storedUserId } : "skip"
  );
  
  // If there is no stored user ID, we know the user is unauthenticated.
  // Ensure state reflects that (avoid staying stuck in loading).
  useEffect(() => {
    if (storedUserId === null) {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, [storedUserId]);

  // Mutations
  const loginMutation = useMutation(api.auth.login);
  const registerMutation = useMutation(api.auth.register);

  // Update authentication state when user data changes
  useEffect(() => {
    if (currentUser === undefined) {
      // Still loading
      return;
    }

    if (currentUser === null) {
      // Not authenticated
      setIsAuthenticated(false);
      setUser(null);
      // Clear any stored session
      if (typeof window !== "undefined") {
        localStorage.removeItem("sims_user_id");
      }
      setStoredUserId(null);
    } else {
      // Authenticated
      setIsAuthenticated(true);
      setUser(currentUser);
    }
  }, [currentUser]);

  // Login function
  const login = useCallback(async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    try {
      const result = await loginMutation({ email, password });
      
      if (result.success) {
        // Store user ID for session management
        if (typeof window !== "undefined") {
          localStorage.setItem("sims_user_id", result.userId);
        }
        setStoredUserId(result.userId);
        
        // Update auth state immediately with returned user to avoid waiting for the follow-up query
        if (result.userId && result.email) {
          const userObj: User = {
            _id: result.userId,
            email: result.email,
            roles: result.roles ?? [],
            profile: result.profile ?? { firstName: "", lastName: "" },
          };
          setIsAuthenticated(true);
          setUser(userObj);
          return { success: true, user: userObj };
        }

        // Fallback
        return { success: true };
      }
      
      return { success: false, error: "Login failed" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during login";
      return { success: false, error: errorMessage };
    }
  }, [loginMutation]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Clear session
      if (typeof window !== "undefined") {
        localStorage.removeItem("sims_user_id");
      }
      setStoredUserId(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  }, []);

  // Register function
  const register = useCallback(async (data: {
    email: string;
    password: string;
    roles: string[];
    profile: {
      firstName: string;
      middleName?: string;
      lastName: string;
    };
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await registerMutation(data);
      
      if (result.success) {
        // Automatically log in after registration
        return await login(data.email, data.password);
      }
      
      return { success: false, error: "Registration failed" };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred during registration";
      return { success: false, error: errorMessage };
    }
  }, [registerMutation, login]);

  // Role checking functions
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.roles.includes(role) ?? false;
  }, [user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.some(role => user.roles.includes(role));
  }, [user]);

  const hasAllRoles = useCallback((roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.every(role => user.roles.includes(role));
  }, [user]);

  // Consider ourselves not loading if we didn't query (no stored user id).
  const isLoading = storedUserId === null ? false : currentUser === undefined;

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    register,
    hasRole,
    hasAnyRole,
    hasAllRoles,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

