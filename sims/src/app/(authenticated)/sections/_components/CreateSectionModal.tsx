"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { Id } from "@/lib/convex";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Select from "@/components/form/Select";
import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";

interface CreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Course = {
  _id: Id<"courses">;
  code: string;
  title: string;
  credits: number;
};

type Term = {
  _id: Id<"terms">;
  name: string;
  sessionId: Id<"academicSessions">;
  startDate: number;
  endDate: number;
};

export default function CreateSectionModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateSectionModalProps) {
  // Initialize session token from localStorage
  const [sessionToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sims_session_token");
    }
    return null;
  });

  const [formData, setFormData] = useState({
    courseId: "",
    termId: "",
    capacity: "",
    details: "",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch courses and terms
  const courses = useQuery(
    api.department.getDepartmentCourses,
    sessionToken ? { token: sessionToken } : "skip"
  ) as Course[] | undefined;

  const terms = useQuery(api.department.getTerms) as Term[] | undefined;

  const createSection = useMutation(api.department.createSection);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        courseId: "",
        termId: "",
        capacity: "",
        details: "",
      });
      setValidationErrors({});
      setApiError(null);
    }
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.courseId) {
      errors.courseId = "Course is required";
    }

    if (!formData.termId) {
      errors.termId = "Term is required";
    }

    if (!formData.capacity) {
      errors.capacity = "Capacity is required";
    } else {
      const capacityNum = parseInt(formData.capacity, 10);
      if (isNaN(capacityNum) || capacityNum <= 0) {
        errors.capacity = "Capacity must be a positive number";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    if (!sessionToken) {
      setApiError("Session expired. Please log in again.");
      return;
    }

    setIsLoading(true);

    try {
      await createSection({
        token: sessionToken,
        courseId: formData.courseId as Id<"courses">,
        termId: formData.termId as Id<"terms">,
        capacity: parseInt(formData.capacity, 10),
        details: formData.details || undefined,
      });

      onSuccess();
    } catch (error: any) {
      const message =
        error?.message || "Failed to create section. Please try again.";
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const courseOptions =
    courses?.map((course) => ({
      value: course._id,
      label: `${course.code} - ${course.title}`,
    })) || [];

  const termOptions =
    terms?.map((term) => ({
      value: term._id,
      label: term.name,
    })) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[600px] p-6 lg:p-10"
    >
      <div className="w-full">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Create New Section
          </h4>
          <p className="mb-6 text-sm text-gray-500 lg:mb-7 dark:text-gray-400">
            Create a new course section for your department.
          </p>
        </div>
        <div className="px-2">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {apiError && (
                <div className="mb-6">
                  <Alert variant="error" title="Error" message={apiError} />
                </div>
              )}

              <div>
                <Label htmlFor="courseId">
                  Course <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Select
                    options={courseOptions}
                    placeholder="Select a course"
                    onChange={(e) => handleInputChange("courseId", e.target.value)}
                    defaultValue={formData.courseId}
                    error={!!validationErrors.courseId}
                    disabled={isLoading}
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
                {validationErrors.courseId && (
                  <p className="text-error-500 mt-1 text-sm">
                    {validationErrors.courseId}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="termId">
                  Term <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Select
                    options={termOptions}
                    placeholder="Select a term"
                    onChange={(e) => handleInputChange("termId", e.target.value)}
                    defaultValue={formData.termId}
                    error={!!validationErrors.termId}
                    disabled={isLoading}
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
                {validationErrors.termId && (
                  <p className="text-error-500 mt-1 text-sm">
                    {validationErrors.termId}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="capacity">
                  Capacity <span className="text-error-500">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Enter capacity"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  error={!!validationErrors.capacity}
                  disabled={isLoading}
                  min="1"
                />
                {validationErrors.capacity && (
                  <p className="text-error-500 mt-1 text-sm">
                    {validationErrors.capacity}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="details">Details (Optional)</Label>
                <textarea
                  id="details"
                  rows={3}
                  placeholder="Enter section details (optional)"
                  value={formData.details}
                  onChange={(e) => handleInputChange("details", e.target.value)}
                  disabled={isLoading}
                  className="h-24 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <div className="mt-8 flex w-full items-center justify-end gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  type="button"
                >
                  Cancel
                </Button>
                <Button size="sm" type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Section"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}

