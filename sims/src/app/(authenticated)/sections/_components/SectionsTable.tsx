'use client';

import React from 'react';
import { Id } from '@/lib/convex';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import Loading from '@/components/loading/Loading';
import { FileIcon } from '@/icons';

type Section = {
  _id: Id<'sections'>;
  courseCode: string;
  courseTitle: string;
  sectionId: Id<'sections'>;
  instructorName: string;
  capacity: number;
  enrollmentCount: number;
  status: string;
  termId: Id<'terms'>;
  termName: string;
};

interface SectionsTableProps {
  sections: Section[] | undefined;
  isLoading: boolean;
}

export default function SectionsTable({ sections, isLoading }: SectionsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading />
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <FileIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>No sections found</p>
        <p className="mt-2 text-sm">Try selecting a different term or create a new section</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
              Course Code
            </TableCell>
            <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
              Course Title
            </TableCell>
            <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
              Section ID
            </TableCell>
            <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
              Current Instructor
            </TableCell>
            <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
              Capacity
            </TableCell>
            <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
              Status
            </TableCell>
            <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
              Term
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sections.map((section) => (
            <TableRow key={section._id}>
              <TableCell className="px-5 py-3 text-start font-medium">
                {section.courseCode}
              </TableCell>
              <TableCell className="px-5 py-3 text-start">
                {section.courseTitle}
              </TableCell>
              <TableCell className="px-5 py-3 text-start text-sm text-gray-600 dark:text-gray-400">
                {section.sectionId.slice(-8)}
              </TableCell>
              <TableCell className="px-5 py-3 text-start">
                {section.instructorName}
              </TableCell>
              <TableCell className="px-5 py-3 text-start">
                {section.enrollmentCount} / {section.capacity}
              </TableCell>
              <TableCell className="px-5 py-3 text-start">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    section.status === "Active"
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}
                >
                  {section.status}
                </span>
              </TableCell>
              <TableCell className="px-5 py-3 text-start text-sm text-gray-600 dark:text-gray-400">
                {section.termName}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

