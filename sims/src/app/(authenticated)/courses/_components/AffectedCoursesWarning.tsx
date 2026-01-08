'use client';

import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import Alert from '@/components/ui/alert/Alert';
import Button from '@/components/ui/button/Button';

type DependentCourse = {
  _id: string;
  code: string;
  title: string;
  matched: string[];
};

type Props = {
  courseId: string;
  candidateCode?: string;
  candidatePrerequisites?: string[];
  onConfirm?: () => void;
};

export default function AffectedCoursesWarning({ courseId, candidateCode, candidatePrerequisites, onConfirm }: Props) {
  const args = { courseId: courseId as any, candidateCode, candidatePrerequisites };
  const dependents = useQuery(api.functions.courses.getDependentCourses, args as any);

  if (dependents === undefined) {
    return null; // loading; parent can show spinner
  }

  if (!dependents || dependents.length === 0) return null;

  return (
    <div className="my-4">
      <Alert
        variant="warning"
        title={dependents.length === 1 ? '1 affected course' : `${dependents.length} affected courses`}
        message={`The following courses have this course listed as a prerequisite and may be affected by your change:`}
      />

      <ul className="mt-3 list-disc list-inside">
        {dependents.map((d: DependentCourse) => (
          <li key={d._id} className="text-sm">
            <strong className="text-gray-800 dark:text-white/90">{d.code}</strong> — {d.title}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex gap-3">
        <Button size="sm" variant="outline" onClick={onConfirm}>Proceed Anyway</Button>
        <Button size="sm" variant="text-only" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Cancel</Button>
      </div>
    </div>
  );
}
