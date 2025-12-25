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

type RosterStudent = {
  studentId: Id<"students">;
  userId: Id<"users">;
  name: string;
  email: string;
  studentNumber: string;
};

export default function SectionDetailPage() {
  const params = useParams();
  const sectionId = params.id as Id<"sections">;

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

  const isLoading = roster === undefined;

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
            <div tab="Roster">
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
            </div>
            <div tab="Assignments">
              <ComponentCard
                title="Assignments"
                desc="Manage assessments and assignments for this section"
              >
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-medium mb-2">Assignments feature coming soon</p>
                  <p className="text-sm">This section will allow you to create and manage assignments</p>
                </div>
              </ComponentCard>
            </div>
            <div tab="Gradebook">
              <ComponentCard
                title="Gradebook"
                desc="View and manage student grades for this section"
              >
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-medium mb-2">Gradebook feature coming soon</p>
                  <p className="text-sm">This section will allow you to view and manage student grades</p>
                </div>
              </ComponentCard>
            </div>
          </Tabs>
        </div>
      )}
      </div>
    </RoleGuard>
  );
}

