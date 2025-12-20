'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { useSidebar } from '@/context/SidebarContext';
import AppHeader from '@/layout/AppHeader';
import AppSidebar from '@/layout/AppSidebar';
import Backdrop from '@/layout/Backdrop';
import { getUser } from '@/services/users.service';
import { useUserStore } from '@/store/user';
import { useAuth } from '@/hooks/useAuth';
import Loading from '@/components/loading/Loading';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();
  const { setUser } = useUserStore();
  const { user: authUser, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (isLoading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated || !authUser) {
      router.push(
        "/login?errorTitle=Session Expired&errorMessage=You've been logged out automatically. Please re-authenticate."
      );
      return;
    }

    // Set user in store
    const user = getUser(authUser);
    if (user) {
      setUser(user);
    }
  }, [pathname, setUser, router, authUser, isAuthenticated, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  // Don't render layout if not authenticated (will redirect)
  if (!isAuthenticated || !authUser) {
    return null;
  }

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? 'ml-0'
    : isExpanded || isHovered
      ? 'lg:ml-[290px]'
      : 'lg:ml-[90px]';

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="mx-auto max-w-7xl p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

