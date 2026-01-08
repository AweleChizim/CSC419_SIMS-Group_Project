'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Loading from '@/components/loading/Loading';
import CourseVersionHistory from '../_components/CourseVersionHistory';
import CourseVersionComparison from '../_components/CourseVersionComparison';
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

  const [leftVersionId, setLeftVersionId] = React.useState<string | null>(null);
  const [rightVersionId, setRightVersionId] = React.useState<string | null>(null);

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

  const versionOptions = (versions || []).map((v: any) => ({ id: v._id, label: `v${v.version} — ${v.title}` }));

  const left = versions?.find((v: any) => v._id === leftVersionId) ?? null;
  const right = versions?.find((v: any) => v._id === rightVersionId) ?? null;

  return (
    <div>
      <PageBreadCrumb items={breadcrumbItems} />

      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Left</label>
          <select
            className="border px-3 py-2 rounded"
            value={leftVersionId ?? ''}
            onChange={(e) => setLeftVersionId(e.target.value || null)}
          >
            <option value="">Select version</option>
            {versionOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Right</label>
          <select
            className="border px-3 py-2 rounded"
            value={rightVersionId ?? ''}
            onChange={(e) => setRightVersionId(e.target.value || null)}
          >
            <option value="">Select version</option>
            {versionOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-sm text-gray-500">Choose two versions to compare.</div>
      </div>

      <ComponentCard title="Course Versions">
        <CourseVersionHistory versions={versions || []} />

        <div className="mt-6">
          <ComponentCard title="Compare Versions">
            <CourseVersionComparison versionA={left} versionB={right} />
          </ComponentCard>
        </div>
      </ComponentCard>
    </div>
  );
}
