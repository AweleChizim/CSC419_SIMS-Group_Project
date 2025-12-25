'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import Loading from '@/components/loading/Loading';
import Alert from '@/components/ui/alert/Alert';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import Accordion from '@/components/ui/accordion/Accordion';

type ActiveGrade = {
  enrollmentId: string;
  sectionId: string;
  course: {
    _id: string;
    code: string;
    title: string;
    credits: number;
  };
  section: {
    _id: string;
  };
  currentGrade: {
    percentage: number;
    letter: string;
    points: number;
  } | null;
  assessments: Array<{
    _id: string;
    title: string;
    totalPoints: number;
    weight: number;
    dueDate: number;
    score: number | null;
    percentage: number | null;
    letter: string | null;
    isMissing: boolean;
  }>;
};

export default function GradesPage() {
  // Initialize session token from localStorage
  const [sessionToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sims_session_token');
    }
    return null;
  });


  // Fetch active grades
  const gradesData = useQuery(
    api.grades.getMyActiveGrades,
    sessionToken ? { token: sessionToken } : 'skip'
  ) as ActiveGrade[] | undefined | Error;


  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getGradeColor = (percentage: number | null): 'success' | 'info' | 'warning' | 'error' | 'light' => {
    if (percentage === null) return 'light';
    if (percentage >= 70) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  const isLoading = gradesData === undefined;
  const isError = gradesData instanceof Error;
  const hasData = Array.isArray(gradesData) && gradesData.length > 0;

  if (isLoading) {
    return (
      <div>
        <PageBreadCrumb pageTitle="My Grades" />
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      </div>
    );
  }

  if (isError) {
    const errorMessage = gradesData instanceof Error ? gradesData.message : 'An error occurred while loading your grades.';
    return (
      <div>
        <PageBreadCrumb pageTitle="My Grades" />
        <div className="space-y-6">
          <Alert
            variant="error"
            title="Error Loading Grades"
            message={errorMessage}
          />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div>
        <PageBreadCrumb pageTitle="My Grades" />
        <div className="space-y-6">
          <Alert
            variant="info"
            title="No Active Courses"
            message="You are not currently enrolled in any active courses."
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageBreadCrumb pageTitle="My Grades" />

      <div className="space-y-6">

        <div className="space-y-4">
          {gradesData.map((gradeData) => {
            const { course, currentGrade, assessments } = gradeData;
            const percentage = currentGrade?.percentage ?? 0;
            const letter = currentGrade?.letter ?? 'N/A';
            const gradeColor = getGradeColor(currentGrade?.percentage ?? null);

            return (
              <Accordion
                key={gradeData.enrollmentId}
                title={`${course.code} - ${course.title}`}
                subtitle={`${course.credits} Credits`}
                headerContent={
                  <>
                    {/* Current Grade */}
                    <div className="text-right">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Current Grade</div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          color={gradeColor}
                          variant="light"
                          size="sm"
                        >
                          {percentage.toFixed(1)}% ({letter})
                        </Badge>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-32">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full transition-all ${
                            percentage >= 70
                              ? 'bg-success-500'
                              : percentage >= 60
                              ? 'bg-blue-500'
                              : percentage >= 50
                              ? 'bg-warning-500'
                              : 'bg-error-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </>
                }
              >
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                          Assignment
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                          Due Date
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                          Weight
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                          Score
                        </TableCell>
                        <TableCell isHeader className="px-5 py-3 text-start font-medium text-gray-500 dark:text-gray-400">
                          Grade
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                            No assessments available for this course.
                          </TableCell>
                        </TableRow>
                      ) : (
                        assessments.map((assessment) => {
                          const hasScore = assessment.score !== null;
                          const isOverdue = assessment.isMissing;
                          const rowClassName = isOverdue
                            ? 'bg-error-50 dark:bg-error-500/10'
                            : '';

                          return (
                            <TableRow key={assessment._id} className={rowClassName}>
                              <TableCell className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  {assessment.title}
                                  {isOverdue && (
                                    <Badge color="error" variant="light" size="sm">
                                      Missing
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-5 py-3">
                                {formatDate(assessment.dueDate)}
                              </TableCell>
                              <TableCell className="px-5 py-3">
                                {assessment.weight}%
                              </TableCell>
                              <TableCell className="px-5 py-3">
                                {hasScore ? (
                                  <span className="font-medium">
                                    {assessment.score?.toFixed(1)} / {assessment.totalPoints}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </TableCell>
                              <TableCell className="px-5 py-3">
                                {hasScore ? (
                                  <Badge
                                    color={getGradeColor(assessment.percentage)}
                                    variant="light"
                                    size="sm"
                                  >
                                    {assessment.percentage?.toFixed(1)}% ({assessment.letter})
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Accordion>
            );
          })}
        </div>
      </div>
    </div>
  );
}

