'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import { Id } from '@/lib/convex';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Input from '@/components/form/input/InputField';
import CoursesTable from './_components/CoursesTable';

type Course = {
  _id: Id<'courses'>;
  code: string;
  title: string;
  credits: number;
  department: {
    _id: Id<'departments'>;
    name: string;
  } | null;
  level: string;
};

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Get session token from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('sims_session_token');
      setSessionToken(token);
    }
  }, []);

  // Fetch courses with search filter
  // Note: Courses are automatically filtered by student's department and level in the backend
  const courses = useQuery(
    api.courses.listPublic,
    sessionToken
      ? {
          token: sessionToken,
          searchQuery: searchQuery || undefined,
        }
      : 'skip'
  ) as Course[] | undefined;

  const isLoading = courses === undefined;

  return (
    <div>
      <PageBreadCrumb pageTitle="Courses" />

      <div className="space-y-6">
        {/* Search */}
        <ComponentCard title="Search Courses">
          <Input
            type="text"
            placeholder="Search by course code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </ComponentCard>

        {/* Courses Table */}
        <ComponentCard title="Courses" desc="Browse available courses">
          <CoursesTable courses={courses} isLoading={isLoading} />
        </ComponentCard>
      </div>
    </div>
  );
}

