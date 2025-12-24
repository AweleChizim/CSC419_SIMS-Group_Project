'use client';

import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import { Id } from '@/lib/convex';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import { useModal } from '@/hooks/useModal';
import { PlusIcon } from '@/icons';
import { RoleGuard } from '@/components/auth/RoleGuard';
import SectionsTable from './_components/SectionsTable';
import CreateSectionModal from './_components/CreateSectionModal';
import InstructorWorkload from './_components/InstructorWorkload';

type Section = {
  _id: Id<'sections'>;
  courseCode: string;
  courseTitle: string;
  sectionId: Id<'sections'>;
  instructorId: Id<'users'> | null;
  instructorName: string;
  capacity: number;
  enrollmentCount: number;
  status: string;
  termId: Id<'terms'>;
  termName: string;
};

type Term = {
  _id: Id<'terms'>;
  name: string;
  sessionId: Id<'academicSessions'>;
  startDate: number;
  endDate: number;
};

export default function SectionsPage() {
  // Initialize session token from localStorage
  const [sessionToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sims_session_token');
    }
    return null;
  });

  const [selectedTermId, setSelectedTermId] = useState<Id<'terms'> | undefined>(undefined);
  const createModal = useModal();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fetch sections
  const sections = useQuery(
    api.department.getSections,
    sessionToken
      ? {
          token: sessionToken,
          termId: selectedTermId,
        }
      : 'skip'
  ) as Section[] | undefined;

  // Fetch terms for filter
  const terms = useQuery(api.department.getTerms) as Term[] | undefined;

  const isLoading = sections === undefined || terms === undefined;

  const handleSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    createModal.closeModal();
  };

  const termOptions = [
    { value: '', label: 'All Terms' },
    ...(terms?.map((term) => ({
      value: term._id,
      label: term.name,
    })) || []),
  ];

  return (
    <RoleGuard role="department_head" unauthorizedMessage="You must be a department head to access this page.">
      <div>
        <PageBreadCrumb pageTitle="Sections" />

        <div className="space-y-6">
          {showSuccessMessage && (
            <Alert variant="success" title="Success" message="Section created successfully!" />
          )}

          {/* Filters and Create Button */}
          <ComponentCard title="Filters">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Label htmlFor="termFilter">Filter by Term:</Label>
                <div className="relative w-full sm:w-64">
                  <Select
                    options={termOptions}
                    placeholder="Select a term"
                    onChange={(e) =>
                      setSelectedTermId(
                        e.target.value ? (e.target.value as Id<'terms'>) : undefined
                      )
                    }
                    defaultValue={selectedTermId || ''}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </div>
              </div>
              <Button
                size="md"
                startIcon={<PlusIcon />}
                onClick={createModal.openModal}
              >
                Create Section
              </Button>
            </div>
          </ComponentCard>
                    {/* Sections Table */}
                    <ComponentCard title="Sections" desc="Manage course sections for your department">
            <SectionsTable 
              sections={sections} 
              isLoading={isLoading}
              sessionToken={sessionToken}
              selectedTermId={selectedTermId}
            />
          </ComponentCard>

          {/* Instructor Workload */}
          <InstructorWorkload sessionToken={sessionToken} />
        </div>

        {/* Create Section Modal */}
        <CreateSectionModal
          isOpen={createModal.isOpen}
          onClose={createModal.closeModal}
          onSuccess={handleSuccess}
        />
      </div>
    </RoleGuard>
  );
}

