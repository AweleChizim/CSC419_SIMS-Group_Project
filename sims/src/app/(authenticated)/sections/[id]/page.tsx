"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { api } from "@/lib/convex";
import { Id } from "@/lib/convex";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Tabs from "@/components/ui/tabs/Tabs";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { GroupIcon } from "@/icons";
import { RoleGuard } from "@/components/auth/RoleGuard";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import CreateAssessmentForm from "./_components/CreateAssessmentForm";
import EditAssessmentForm from "./_components/EditAssessmentForm";
import AssessmentsList from "./_components/AssessmentsList";
import GradebookMatrix from "./_components/GradebookMatrix";
import { useMutation } from "convex/react";

// TabPane component to properly type the tab prop
// This component accepts the 'tab' prop that the Tabs component expects
interface TabPaneProps {
  tab: string;
  children: React.ReactNode;
}

const TabPane: React.FC<TabPaneProps> = ({ children }) => {
  return <>{children}</>;
};

type RosterStudent = {
  studentId: Id<"students">;
  userId: Id<"users">;
  name: string;
  email: string;
  studentNumber: string;
};

type Assessment = {
  _id: Id<"assessments">;
  sectionId: Id<"sections">;
  title: string;
  weight: number;
  totalPoints: number;
  dueDate: number;
};

export default function SectionDetailPage() {
  const params = useParams();
  const sectionId = params.id as Id<"sections">;
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteAssessmentMutation = useMutation(
    (api as any)["mutations/assessmentMutations"].deleteAssessment
  );

  // Initialize session token from localStorage
  const [sessionToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sims_session_token");
    }
    return null;
  });

  // Fetch roster data
  const roster = useQuery(
    api.instructors.getRoster,
    sessionToken && sectionId
      ? { sectionId, token: sessionToken }
      : "skip"
  ) as RosterStudent[] | undefined;

  // Fetch assessments
  const assessments = useQuery(
    api.assessments.getBySection,
    sectionId ? { sectionId } : "skip"
  );

  const isLoading = roster === undefined;

  // Get session token from localStorage
  const getSessionToken = (): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sims_session_token");
    }
    return null;
  };

  const handleEdit = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssessment) return;

    setIsDeleting(true);
    try {
      const token = getSessionToken();
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      await deleteAssessmentMutation({
        assessmentId: selectedAssessment._id,
        token,
      });

      setIsDeleteModalOpen(false);
      setSelectedAssessment(null);
    } catch (error) {
      console.error('Error deleting assessment:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete assessment');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedAssessment(null);
  };

  return (
    <RoleGuard role="instructor" unauthorizedMessage="You must be an instructor to access this page.">
      <div>
        <PageBreadCrumb pageTitle="Section Details" />

        {isLoading ? (
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50" />
        </div>
      ) : (
        <div className="space-y-6">
          <Tabs tabStyle="independent" justifyTabs="left">
            <TabPane tab="Roster">
              <ComponentCard
                title="Class Roster"
                desc="List of students enrolled in this section"
              >
                {roster && roster.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                            Student Number
                          </TableCell>
                          <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                            Name
                          </TableCell>
                          <TableCell isHeader className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                            Email
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {roster.map((student) => (
                          <TableRow
                            key={student.studentId}
                            className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <TableCell className="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                              {student.studentNumber}
                            </TableCell>
                            <TableCell className="px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                              {student.name}
                            </TableCell>
                            <TableCell className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                              {student.email}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <GroupIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                    <p className="mt-4 text-lg font-medium text-gray-500 dark:text-gray-400">
                      No students enrolled
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Students will appear here once they enroll in this section
                    </p>
                  </div>
                )}
              </ComponentCard>
            </TabPane>
            <TabPane tab="Assessments">
              <ComponentCard
                title="Assessments"
                desc="Manage assessments and assignments for this section"
              >
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
                      Create Assessment
                    </Button>
                  </div>
                  <AssessmentsList 
                    assessments={assessments || []} 
                    isLoading={assessments === undefined}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                </div>
              </ComponentCard>
              <CreateAssessmentForm
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                  setIsCreateModalOpen(false);
                }}
                sectionId={sectionId}
                existingAssessments={assessments || []}
              />
              <EditAssessmentForm
                isOpen={isEditModalOpen}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setSelectedAssessment(null);
                }}
                onSuccess={() => {
                  setIsEditModalOpen(false);
                  setSelectedAssessment(null);
                }}
                assessment={selectedAssessment}
                existingAssessments={assessments || []}
              />
              <Modal
                isOpen={isDeleteModalOpen}
                onClose={handleDeleteCancel}
                className="max-w-[500px] p-5 lg:p-10"
              >
                <h4 className="text-title-sm mb-4 font-semibold text-gray-800 dark:text-white/90">
                  Delete Assessment
                </h4>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                  Are you sure you want to delete "{selectedAssessment?.title}"? This action cannot be undone.
                </p>
                {selectedAssessment && (
                  <p className="mb-6 text-xs text-warning-600 dark:text-warning-400">
                    Note: This assessment cannot be deleted if grades have been recorded for it.
                  </p>
                )}
                <div className="flex w-full items-center justify-end gap-3">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDeleteCancel}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </Modal>
            </TabPane>
            <TabPane tab="Gradebook">
              <ComponentCard
                title="Gradebook"
                desc="View and manage student grades for this section"
              >
                <GradebookMatrix sectionId={sectionId} />
              </ComponentCard>
            </TabPane>
          </Tabs>
        </div>
      )}
      </div>
    </RoleGuard>
  );
}

