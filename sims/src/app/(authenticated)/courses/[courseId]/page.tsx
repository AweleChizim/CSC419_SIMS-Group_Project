'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { Id } from '@/lib/convex';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import Loading from '@/components/loading/Loading';
import Button from '@/components/ui/button/Button';
import Badge from '@/components/ui/badge/Badge';
import Alert from '@/components/ui/alert/Alert';

type CourseDetails = {
  title: string;
  description: string;
  prerequisites: string[];
  activeSections: Array<{
    sectionId: string;
    instructor: string;
    schedule: string;
    room: string;
    seatsAvailable: number;
  }>;
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as Id<'courses'>;

  // Initialize session token from localStorage
  const [sessionToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sims_session_token');
    }
    return null;
  });

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  const [enrollingSectionId, setEnrollingSectionId] = useState<string | null>(null);

  // Fetch course details
  const courseDetails = useQuery(
    api.courses.getDetails,
    courseId ? { courseId } : 'skip'
  ) as CourseDetails | undefined;

  // @ts-ignore - Convex API path with slashes
  const enrollMutation = useMutation(api["mutations/enrollmentMutations"].enroll);

  const isLoading = courseDetails === undefined;

  const handleEnroll = async (sectionId: string) => {
    if (!sessionToken) {
      setEnrollmentError('Authentication required. Please log in.');
      return;
    }

    setEnrollingSectionId(sectionId);
    setEnrollmentError(null);

    try {
      await enrollMutation({
        sectionId: sectionId as Id<'sections'>,
        token: sessionToken,
      });
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (error) {
      let errorMessage = 'Failed to enroll in section';
      
      if (error instanceof Error) {
        // Extract clean error message from Convex error
        const fullMessage = error.message;
        
        // Look for user-friendly error messages
        if (fullMessage.includes('You have already enrolled for this course')) {
          errorMessage = 'You have already enrolled for this course.';
        } else if (fullMessage.includes('Section Full')) {
          errorMessage = 'This section is full.';
        } else if (fullMessage.includes('Missing prerequisites')) {
          errorMessage = fullMessage.replace(/.*Missing prerequisites:\s*/, 'Missing prerequisites: ');
        } else if (fullMessage.includes('Schedule conflicts') || fullMessage.includes('Schedule conflict')) {
          // Extract the conflict details and format them nicely
          const conflictMatch = fullMessage.match(/Schedule conflicts? with:\s*(.+?)(?:\s+Called by client)?$/i);
          if (conflictMatch && conflictMatch[1]) {
            const conflicts = conflictMatch[1].split(',').map(c => c.trim());
            if (conflicts.length === 1) {
              // Single conflict - format nicely
              // Format: "COS 409 on Mon 09:00-12:00"
              errorMessage = `Schedule conflict: This section conflicts with ${conflicts[0]}.`;
            } else {
              // Multiple conflicts
              errorMessage = `Schedule conflict: This section conflicts with your existing enrollments: ${conflicts.join(', ')}.`;
            }
          } else {
            errorMessage = 'Schedule conflict: This section conflicts with one of your existing enrollments.';
          }
        } else if (fullMessage.includes('Enrollment deadline has passed')) {
          errorMessage = fullMessage.replace(/.*Enrollment deadline has passed[^:]*:\s*/, 'Enrollment deadline has passed. ');
        } else if (fullMessage.includes('Authentication required')) {
          errorMessage = 'Authentication required. Please log in.';
        } else if (fullMessage.includes('Invalid session token')) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (fullMessage.includes('Only students can enroll')) {
          errorMessage = 'Only students can enroll in sections.';
        } else {
          // Try to extract the error message after "Error: " or "Uncaught Error: "
          const errorMatch = fullMessage.match(/(?:Uncaught )?Error:\s*(.+?)(?:\s+Called by client)?$/);
          if (errorMatch && errorMatch[1]) {
            errorMessage = errorMatch[1].trim();
          } else {
            // Fallback: use the full message but remove Convex prefixes
            errorMessage = fullMessage.replace(/\[CONVEX[^\]]+\]\s*/g, '').replace(/\[Request ID:[^\]]+\]\s*/g, '').replace(/Server Error\s*/g, '').trim();
          }
        }
      }
      
      setEnrollmentError(errorMessage);
      setTimeout(() => setEnrollmentError(null), 5000);
    } finally {
      setEnrollingSectionId(null);
    }
  };

  const breadcrumbItems = [
    { name: 'Course', href: '/courses' },
    { name: 'Course Details' }
  ];

  if (isLoading) {
    return (
      <div>
        <PageBreadCrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      </div>
    );
  }

  if (!courseDetails) {
    return (
      <div>
        <PageBreadCrumb items={breadcrumbItems} />
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadCrumb items={breadcrumbItems} />

      <div className="space-y-6">
        {showSuccessMessage && (
          <Alert variant="success" title="Success" message="Successfully enrolled in section!" />
        )}
        {enrollmentError && (
          <Alert variant="error" title="Enrollment Error" message={enrollmentError} />
        )}
        {/* Course Information */}
        <ComponentCard title={courseDetails.title}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Description
              </h3>
              <p className="text-gray-800 dark:text-white/90">
                {courseDetails.description}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Prerequisites
              </h3>
              {courseDetails.prerequisites.length > 0 ? (
                <ul className="list-disc list-inside space-y-1">
                  {courseDetails.prerequisites.map((prereq, index) => (
                    <li key={index} className="text-gray-800 dark:text-white/90">
                      {prereq}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No prerequisites</p>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Available Sections Table */}
        <ComponentCard title="Available Sections" desc="Browse available class sections for this course">
          {courseDetails.activeSections.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                      Instructor
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                      Schedule
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                      Room
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                      Seats Available
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courseDetails.activeSections.map((section) => (
                    <TableRow key={section.sectionId}>
                      <TableCell className="px-5 py-3 text-start">
                        {section.instructor}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-start">
                        {section.schedule}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-start">
                        {section.room}
                      </TableCell>
                      <TableCell className="px-5 py-3 text-start">
                        <Badge 
                          color={section.seatsAvailable > 0 ? 'success' : 'light'} 
                          variant="light" 
                          size="sm"
                        >
                          {section.seatsAvailable}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-start">
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={section.seatsAvailable <= 0 || enrollingSectionId === section.sectionId}
                          onClick={() => handleEnroll(section.sectionId)}
                        >
                          {enrollingSectionId === section.sectionId ? 'Enrolling...' : 'Enroll'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg font-medium mb-2">No active sections available</p>
              <p className="text-sm">Check back later for available sections</p>
            </div>
          )}
        </ComponentCard>
      </div>
    </div>
  );
}

