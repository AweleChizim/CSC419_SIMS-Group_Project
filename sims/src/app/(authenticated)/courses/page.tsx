'use client';

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isStudent, isDepartmentHead } from '@/services/permissions.service';
import StudentCoursesPage from './_components/StudentCoursesPage';
import DepartmentHeadCoursesPage from './_components/DepartmentHeadCoursesPage';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CoursesPage() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const userIsStudent = isStudent(roles);
  const userIsDepartmentHead = isDepartmentHead(roles);

  // Only allow students and department heads
  if (!userIsStudent && !userIsDepartmentHead) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4 dark:text-red-400">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Only students and department heads can access courses.
          </p>
        </div>
      </div>
    );
  }

  if (userIsStudent) {
    return <StudentCoursesPage />;
  }

  if (userIsDepartmentHead) {
    return <DepartmentHeadCoursesPage />;
  }

  return null;
}

