'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Loading from '@/components/loading/Loading';
import CourseVersionHistory from '../_components/CourseVersionHistory';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';

export default function CourseVersionsPage() {
  const params = useParams();
  const courseId = params.courseId;

  const versions = useQuery(api.functions.courses.getVersions, courseId ? { courseId } : 'skip');

  const breadcrumbItems = [
    { name: 'Course', href: '/courses' },
    { name: 'Versions' }
  ];

  if (versions === undefined) {
    return (
      <div>
        <PageBreadCrumb items={breadcrumbItems} />
        <div className="py-12 flex items-center justify-center">
          <Loading />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadCrumb items={breadcrumbItems} />

      <ComponentCard title="Course Versions">
        <CourseVersionHistory versions={versions || []} />
      </ComponentCard>
    </div>
  );
}
