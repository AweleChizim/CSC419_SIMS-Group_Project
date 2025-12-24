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
  sessionYearLabel: string;
  startDate: number;
  endDate: number;
};

type AcademicSession = {
  _id: Id<'academicSessions'>;
  yearLabel: string;
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

  const [selectedSessionId, setSelectedSessionId] = useState<Id<'academicSessions'> | undefined>(undefined);
  const [selectedTermId, setSelectedTermId] = useState<Id<'terms'> | undefined>(undefined);
  const createModal = useModal();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fetch academic sessions
  const academicSessions = useQuery(api.academicSessions.listSessions) as AcademicSession[] | undefined;

  // Fetch terms - filter by selected session if provided
  const allTerms = useQuery(api.department.getTerms) as Term[] | undefined;
  const terms = selectedSessionId
    ? allTerms?.filter((term) => term.sessionId === selectedSessionId)
    : allTerms;

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

  const isLoading = sections === undefined || terms === undefined || academicSessions === undefined;

  const handleSuccess = () => {
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
    createModal.closeModal();
  };

  const handleSessionChange = (sessionId: string) => {
    const newSessionId = sessionId ? (sessionId as Id<'academicSessions'>) : undefined;
    setSelectedSessionId(newSessionId);
    // Reset term selection when session changes
    setSelectedTermId(undefined);
  };

  const sessionOptions = [
    { value: '', label: 'All Sessions' },
    ...(academicSessions?.map((session) => ({
      value: session._id,
      label: session.yearLabel,
    })) || []),
  ];

  const termOptions = [
    { value: '', label: selectedSessionId ? 'All Terms' : 'Select Session First' },
    ...(terms?.map((term) => ({
      value: term._id,
      label: `${term.name} (${term.sessionYearLabel})`,
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
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="sessionFilter">Session:</Label>
                  <div className="relative w-full sm:w-48">
                    <Select
                      options={sessionOptions}
                      placeholder="Select a session"
                      onChange={(e) => handleSessionChange(e.target.value)}
                      defaultValue={selectedSessionId || ''}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="termFilter">Term:</Label>
                  <div className="relative w-full sm:w-48">
                    <Select
                      options={termOptions}
                      placeholder={selectedSessionId ? "Select a term" : "Select session first"}
                      onChange={(e) =>
                        setSelectedTermId(
                          e.target.value ? (e.target.value as Id<'terms'>) : undefined
                        )
                      }
                      defaultValue={selectedTermId || ''}
                      disabled={!selectedSessionId}
                    />
                  </div>
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

