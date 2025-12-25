'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/convex';
import { Id } from '@/lib/convex';
import Button from '@/components/ui/button/Button';
import GradebookMatrixTable from '@/components/tables/GradebookMatrixTable';
import Alert from '@/components/ui/alert/Alert';
import BulkGradeUpload from './BulkGradeUpload';

type Assessment = {
  _id: Id<"assessments">;
  title: string;
  totalPoints: number;
  weight: number;
};

type EnrollmentGrade = {
  enrollmentId: Id<"enrollments">;
  studentId: Id<"students">;
  studentNumber: string;
  studentName: string;
  grades: Array<{
    assessmentId: Id<"assessments">;
    score: number;
    gradeId: Id<"grades">;
  }>;
};

type GradebookData = {
  enrollments: EnrollmentGrade[];
  assessments: Assessment[];
};

interface GradebookMatrixProps {
  sectionId: Id<"sections">;
}

export default function GradebookMatrix({ sectionId }: GradebookMatrixProps) {
  const [sessionToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sims_session_token");
    }
    return null;
  });

  // Fetch gradebook data
  const gradebookData = useQuery(
    api.grades.getBySection,
    sessionToken && sectionId
      ? { sectionId, token: sessionToken }
      : "skip"
  ) as GradebookData | undefined;

  // Mutation for updating grades
  // @ts-expect-error - Convex API path with slashes
  const updateGradesMutation = useMutation(api["mutations/gradeMutations"].updateGrades);

  // Local state for editing grades
  const [gradeValues, setGradeValues] = useState<Map<string, string>>(new Map());
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  
  // Alert state
  const [alertMessage, setAlertMessage] = useState<{ variant: 'error' | 'success' | 'warning' | 'info'; title: string; message: string } | null>(null);

  // Initialize grade values from fetched data
  useEffect(() => {
    if (gradebookData) {
      const newGradeValues = new Map<string, string>();
      gradebookData.enrollments.forEach((enrollment) => {
        gradebookData.assessments.forEach((assessment) => {
          const grade = enrollment.grades.find((g) => g.assessmentId === assessment._id);
          const key = `${enrollment.enrollmentId}-${assessment._id}`;
          // Format score to avoid floating-point precision issues
          // Round to 2 decimal places
          if (grade) {
            // Round to 2 decimal places to fix floating-point precision
            const rounded = Math.round(grade.score * 100) / 100;
            // Convert to string, removing unnecessary trailing zeros
            const formattedScore = parseFloat(rounded.toFixed(2)).toString();
            newGradeValues.set(key, formattedScore);
          } else {
            newGradeValues.set(key, '');
          }
        });
      });
      setGradeValues(newGradeValues);
      setHasChanges(false);
    }
  }, [gradebookData]);

  // Handle input change
  const handleScoreChange = (enrollmentId: Id<"enrollments">, assessmentId: Id<"assessments">, value: string) => {
    const key = `${enrollmentId}-${assessmentId}`;
    const newGradeValues = new Map(gradeValues);
    newGradeValues.set(key, value);
    setGradeValues(newGradeValues);
    setHasChanges(true);
  };

  // Handle save
  const handleSave = async () => {
    if (!gradebookData || !sessionToken) return;

    // Client-side validation: Check for scores exceeding maximum
    const validationErrors: string[] = [];
    
    gradebookData.enrollments.forEach((enrollment) => {
      gradebookData.assessments.forEach((assessment) => {
        const key = `${enrollment.enrollmentId}-${assessment._id}`;
        const value = gradeValues.get(key)?.trim();
        
        if (value && value !== '') {
          const score = parseFloat(value);
          if (!isNaN(score)) {
            if (score < 0) {
              validationErrors.push(
                `Score cannot be negative for ${enrollment.studentName} - ${assessment.title}`
              );
            } else if (score > assessment.totalPoints) {
              validationErrors.push(
                `Score (${score}) exceeds maximum score (${assessment.totalPoints}) for ${enrollment.studentName} - ${assessment.title}`
              );
            }
          }
        }
      });
    });

    // If validation errors exist, show them and stop
    if (validationErrors.length > 0) {
      setAlertMessage({
        variant: 'error',
        title: 'Validation Error',
        message: validationErrors.join('\n'),
      });
      // Auto-dismiss after 10 seconds
      setTimeout(() => setAlertMessage(null), 10000);
      return;
    }

    setIsSaving(true);
    try {
      // Build array of grade updates
      const gradesToUpdate: Array<{
        enrollmentId: Id<"enrollments">;
        assessmentId: Id<"assessments">;
        score: number;
      }> = [];

      gradebookData.enrollments.forEach((enrollment) => {
        gradebookData.assessments.forEach((assessment) => {
          const key = `${enrollment.enrollmentId}-${assessment._id}`;
          const value = gradeValues.get(key)?.trim();
          
          if (value && value !== '') {
            const score = parseFloat(value);
            if (!isNaN(score) && score >= 0) {
              gradesToUpdate.push({
                enrollmentId: enrollment.enrollmentId,
                assessmentId: assessment._id,
                score,
              });
            }
          }
        });
      });

      if (gradesToUpdate.length > 0) {
        await updateGradesMutation({
          grades: gradesToUpdate,
          token: sessionToken,
        });
        setHasChanges(false);
        setAlertMessage({
          variant: 'success',
          title: 'Success',
          message: 'Grades saved successfully!',
        });
        // Auto-dismiss after 5 seconds
        setTimeout(() => setAlertMessage(null), 5000);
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      
      // Parse error message for user-friendly display
      let errorTitle = 'Error Saving Grades';
      let errorMessage = 'Failed to save grades. Please try again.';
      
      if (error instanceof Error) {
        const errorStr = error.message;
        
        // Check for score validation errors
        if (errorStr.includes('exceeds maximum score')) {
          // Extract score and max score from error message
          const scoreMatch = errorStr.match(/Score \((\d+(?:\.\d+)?)\) exceeds maximum score \((\d+(?:\.\d+)?)\)/);
          if (scoreMatch) {
            errorTitle = 'Invalid Score';
            errorMessage = `The score ${scoreMatch[1]} exceeds the maximum allowed score of ${scoreMatch[2]}. Please enter a score between 0 and ${scoreMatch[2]}.`;
          } else {
            errorTitle = 'Invalid Score';
            errorMessage = 'One or more scores exceed the maximum allowed points. Please check your entries and ensure all scores are within the valid range.';
          }
        } else if (errorStr.includes('Score cannot be negative')) {
          errorTitle = 'Invalid Score';
          errorMessage = 'Scores cannot be negative. Please enter a score of 0 or higher.';
        } else if (errorStr.includes('Access denied')) {
          errorTitle = 'Access Denied';
          errorMessage = 'You do not have permission to update grades for this section.';
        } else {
          // Generic error message
          errorMessage = errorStr;
        }
      }
      
      setAlertMessage({
        variant: 'error',
        title: errorTitle,
        message: errorMessage,
      });
      // Auto-dismiss after 10 seconds
      setTimeout(() => setAlertMessage(null), 10000);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate class average for an assessment
  const calculateAverage = (assessmentId: Id<"assessments">): number | null => {
    if (!gradebookData) return null;

    const scores: number[] = [];
    gradebookData.enrollments.forEach((enrollment) => {
      const key = `${enrollment.enrollmentId}-${assessmentId}`;
      const value = gradeValues.get(key)?.trim();
      if (value && value !== '') {
        const score = parseFloat(value);
        if (!isNaN(score)) {
          scores.push(score);
        }
      }
    });

    if (scores.length === 0) return null;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  };

  if (!gradebookData) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <p>Loading gradebook...</p>
      </div>
    );
  }

  if (gradebookData.assessments.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium mb-2">No assessments found</p>
        <p className="text-sm">Create assessments to start entering grades</p>
      </div>
    );
  }

  if (gradebookData.enrollments.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">
        <p className="text-lg font-medium mb-2">No students enrolled</p>
        <p className="text-sm">Students will appear here once they enroll in this section</p>
      </div>
    );
  }

  // Handle bulk upload save
  const handleBulkSave = async (grades: Array<{
    enrollmentId: Id<"enrollments">;
    assessmentId: Id<"assessments">;
    score: number;
  }>) => {
    if (!sessionToken) return;

    setIsSaving(true);
    try {
      await updateGradesMutation({
        grades,
        token: sessionToken,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving bulk grades:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle bulk upload completion
  const handleBulkUploadComplete = () => {
    // Refresh the gradebook data by triggering a re-render
    // The useQuery will automatically refetch
    setShowBulkUpload(false);
  };

  return (
    <div className="space-y-4">
      {/* Alert messages */}
      {alertMessage && (
        <Alert
          variant={alertMessage.variant}
          title={alertMessage.title}
          message={alertMessage.message}
        />
      )}

      {/* Toggle between manual entry and bulk upload */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={!showBulkUpload ? "primary" : "outline"}
            onClick={() => setShowBulkUpload(false)}
          >
            Manual Entry
          </Button>
          <Button
            size="sm"
            variant={showBulkUpload ? "primary" : "outline"}
            onClick={() => setShowBulkUpload(true)}
          >
            Bulk Upload
          </Button>
        </div>
        {!showBulkUpload && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Grades'}
          </Button>
        )}
      </div>

      {showBulkUpload ? (
        <BulkGradeUpload
          sectionId={sectionId}
          gradebookData={gradebookData}
          onUploadComplete={handleBulkUploadComplete}
          onSaveGrades={handleBulkSave}
        />
      ) : (
        <GradebookMatrixTable
          enrollments={gradebookData.enrollments}
          assessments={gradebookData.assessments}
          gradeValues={gradeValues}
          onScoreChange={handleScoreChange}
          calculateAverage={calculateAverage}
        />
      )}
    </div>
  );
}

