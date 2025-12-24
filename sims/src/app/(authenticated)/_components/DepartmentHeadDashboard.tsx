"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { Id } from "@/lib/convex";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import MetricCard from "@/components/common/MetricCard";
import { UserIcon, GroupIcon, FileIcon } from "@/icons";

type DashboardStats = {
  totalInstructors: number;
  activeSections: number;
  unassignedSections: number;
};

type Section = {
  _id: Id<"sections">;
  courseCode: string;
  courseTitle: string;
  sectionId: Id<"sections">;
  instructorId: Id<"users"> | null;
  instructorName: string;
  capacity: number;
  enrollmentCount: number;
  status: string;
  termId: Id<"terms">;
  termName: string;
};

type Term = {
  _id: Id<"terms">;
  name: string;
  sessionId: Id<"academicSessions">;
  startDate: number;
  endDate: number;
};

export default function DepartmentHeadDashboard() {
  // Initialize session token from localStorage
  const [sessionToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sims_session_token");
    }
    return null;
  });

  const [selectedTermId, setSelectedTermId] = useState<Id<"terms"> | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch dashboard stats
  const stats = useQuery(
    api.department.getDashboardStats,
    sessionToken ? { token: sessionToken } : "skip"
  ) as DashboardStats | undefined;

  // Fetch sections
  const sections = useQuery(
    api.department.getSections,
    sessionToken
      ? {
          token: sessionToken,
          termId: selectedTermId,
        }
      : "skip"
  ) as Section[] | undefined;

  // Fetch terms for filter
  const terms = useQuery(api.department.getTerms) as Term[] | undefined;

  const isLoading = stats === undefined || sections === undefined || terms === undefined;

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    // The query will automatically refetch
  };

  return (
    <div>
      <PageBreadCrumb pageTitle="Department Dashboard" />

      {isLoading ? (
        <div className="space-y-6">
          {/* Loading skeleton */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50"
              />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800/50" />
        </div>
      ) : stats ? (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="Total Instructors"
              value={stats.totalInstructors}
              icon={<UserIcon className="h-6 w-6 text-brand-500" />}
              description="Instructors teaching in your department"
            />
            <MetricCard
              title="Active Sections"
              value={stats.activeSections}
              icon={<FileIcon className="h-6 w-6 text-brand-500" />}
              description="Sections with assigned instructors"
            />
            <MetricCard
              title="Unassigned Sections"
              value={stats.unassignedSections}
              icon={<GroupIcon className="h-6 w-6 text-brand-500" />}
              description="Sections needing instructor assignment"
            />
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
          <p className="text-lg font-medium mb-2">Unable to load dashboard</p>
          <p className="text-sm">Please try refreshing the page</p>
        </div>
      )}
    </div>
  );
}

