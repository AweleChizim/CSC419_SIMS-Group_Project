'use client';

import React from 'react';
import Badge from '@/components/ui/badge/Badge';
import Button from '@/components/ui/button/Button';

export type CourseVersion = {
  _id: string;
  version: number;
  title: string;
  description?: string;
  credits?: number;
  prerequisites?: string[];
  isActive?: boolean;
  createdAt?: number;
};

type Props = {
  versions: CourseVersion[];
  onArchive?: (id: string) => void; // wired later
  onRestore?: (id: string) => void; // wired later
};

export default function CourseVersionHistory({ versions, onArchive, onRestore }: Props) {
  if (!versions || versions.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium mb-2">No versions available</p>
        <p className="text-sm">Create a version from the admin interface.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />

      <div className="space-y-8 pl-10">
        {versions.map((v) => (
          <div key={v._id} className="relative">
            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-white border-2 border-brand-500 dark:bg-brand-500" />

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Version</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white/90">{v.version}</div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white/90">{v.title}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{v.description}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge color={v.isActive ? 'success' : 'light'} variant="light" size="sm">
                      {v.isActive ? 'Active' : 'Archived'}
                    </Badge>

                    {v.isActive ? (
                      <Button size="sm" variant="outline" onClick={() => onArchive && onArchive(v._id)}>
                        Archive
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => onRestore && onRestore(v._id)}>
                        Restore
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Created: {v.createdAt ? new Date(v.createdAt).toLocaleString() : '—'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
