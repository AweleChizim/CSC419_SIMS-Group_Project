'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api, Id } from '@/lib/convex';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Loading from '@/components/loading/Loading';
import CourseVersionHistory, { type CourseVersion } from '../../_components/CourseVersionHistory';
import CourseVersionComparison from '../../_components/CourseVersionComparison';
import PrerequisitesGraph from '../../_components/PrerequisitesGraph';
import Alert from '@/components/ui/alert/Alert';

export default function CourseVersionsPage() {
  const params = useParams();
  const courseId = (Array.isArray(params.courseId) ? params.courseId[0] : params.courseId) as Id<'courses'> | undefined;

  const breadcrumbItems = [
    { name: 'Course', href: '/courses' },
    { name: 'Versions' }
  ];

  const [leftVersionId, setLeftVersionId] = React.useState<string | null>(null);
  const [rightVersionId, setRightVersionId] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  function handleRetry() {
    // Remount inner query block to re-run Convex queries
    setRefreshKey((k) => k + 1);
  }

  const VersionBlock: React.FC<{ keyId: number }> = () => {
    // Keyed component to allow remount/retry
    const versions = useQuery(api.functions.courses.getVersions, courseId ? { courseId: courseId as Id<'courses'> } : 'skip');
    const graphRes = useQuery(api.functions.courses.getPrerequisitesGraph, courseId ? { courseId: courseId as Id<'courses'> } : 'skip');

    if (versions === undefined || graphRes === undefined) {
      return (
        <div className="py-12 flex items-center justify-center">
          <Loading />
        </div>
      );
    }

    const versionOptions = (versions || []).map((v: CourseVersion) => ({ id: v._id, label: `v${v.version} — ${v.title}` }));
    const left = versions?.find((v: CourseVersion) => v._id === leftVersionId) ?? null;
    const right = versions?.find((v: CourseVersion) => v._id === rightVersionId) ?? null;

    const graph = graphRes?.graph ?? {};
    const validation = graphRes?.validation ?? { valid: true };

    return (
      <>
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

          <div className="ml-auto text-sm text-gray-500">Select two versions to compare changes.</div>

          <div>
            <button className="text-sm text-gray-500" onClick={() => handleRetry()}>Refresh</button>
          </div>
        </div>

        <ComponentCard title="Course Versions">
          <CourseVersionHistory versions={versions || []} isLoading={false} error={null} onRetry={() => handleRetry()} />

          <div className="mt-6">
            <ComponentCard title="Compare Versions">
              <CourseVersionComparison versionA={left} versionB={right} />
            </ComponentCard>
          </div>

          <div className="mt-6">
            <ComponentCard title="Prerequisites Graph">
              {validation && !validation.valid ? (
                <div className="mb-4">
                  <Alert variant="error" title="Circular prerequisite detected" message={validation.cycle ? `Cycle: ${validation.cycle.join(' -> ')}` : (validation.reason || 'Invalid prerequisite chain')} />
                </div>
              ) : null}

              {Object.keys(graph).length === 0 ? (
                <div className="py-6 text-center text-gray-500">No prerequisites found for this course.</div>
              ) : (
                <PrerequisitesGraph
                  graph={graph}
                  root={undefined}
                  width={800}
                  height={360}
                  validation={validation}
                  onNodeClick={(code: string) => window.location.href = `/courses?searchQuery=${encodeURIComponent(code)}`}
                />
              )}
            </ComponentCard>
          </div>
        </ComponentCard>
      </>
    );
  };

  return (
    <div>
      <PageBreadCrumb items={breadcrumbItems} />

      <VersionBlock key={refreshKey} keyId={refreshKey} />
    </div>
  );
}
