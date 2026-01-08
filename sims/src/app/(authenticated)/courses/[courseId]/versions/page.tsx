'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Loading from '@/components/loading/Loading';
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
        {versions.length === 0 ? (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium mb-2">No versions available</p>
            <p className="text-sm">Create a version from the admin interface.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Version</TableCell>
                  <TableCell isHeader>Title</TableCell>
                  <TableCell isHeader>Credits</TableCell>
                  <TableCell isHeader>Created</TableCell>
                  <TableCell isHeader>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((v: any) => (
                  <TableRow key={v._id}>
                    <TableCell>{v.version}</TableCell>
                    <TableCell>{v.title}</TableCell>
                    <TableCell>{v.credits}</TableCell>
                    <TableCell>{v.createdAt ? new Date(v.createdAt).toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <Badge color={v.isActive ? 'success' : 'light'} variant="light" size="sm">
                        {v.isActive ? 'Active' : 'Archived'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
