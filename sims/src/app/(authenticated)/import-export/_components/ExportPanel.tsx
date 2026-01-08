'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/lib/convex';
import { Id } from '@/lib/convex';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import { DownloadIcon } from '@/icons';

type Department = {
    _id: Id<'departments'>;
    name: string;
};

type Section = {
    _id: Id<'sections'>;
    courseCode: string;
    courseTitle: string;
};

interface ExportPanelProps {
    onExportComplete?: () => void;
}

export default function ExportPanel({ onExportComplete }: ExportPanelProps) {
    const [sessionToken] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sims_session_token');
        }
        return null;
    });

    // Export state
    const [exportType, setExportType] = useState<'students' | 'courses' | 'enrollments'>('students');
    const [exportDepartmentId, setExportDepartmentId] = useState<string>('');
    const [exportSectionId, setExportSectionId] = useState<string>('');
    const [exportStatus, setExportStatus] = useState<string>('');
    const [exportLevel, setExportLevel] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{
        variant: 'error' | 'success' | 'warning' | 'info';
        title: string;
        message: string;
    } | null>(null);

    // Fetch departments
    const departments = useQuery(
        api.functions.departments.list,
        sessionToken ? { token: sessionToken } : 'skip'
    ) as Department[] | undefined;

    // Fetch sections for enrollment export
    const sectionsData = useQuery(
        api.functions.registrar.getAllSectionsStatus,
        sessionToken ? { token: sessionToken } : 'skip'
    ) as Array<{
        _id: Id<'sections'>;
        courseCode: string;
        courseTitle: string;
    }> | undefined;

    // Export queries
    const exportStudentsQuery = useQuery(
        api.functions.importExport.exportStudents,
        isExporting && exportType === 'students' && sessionToken
            ? {
                departmentId: exportDepartmentId ? (exportDepartmentId as Id<'departments'>) : undefined,
                status: exportStatus || undefined,
                level: exportLevel || undefined,
                token: sessionToken,
            }
            : 'skip'
    );

    const exportCoursesQuery = useQuery(
        api.functions.importExport.exportCourses,
        isExporting && exportType === 'courses' && sessionToken
            ? {
                departmentId: exportDepartmentId ? (exportDepartmentId as Id<'departments'>) : undefined,
                level: exportLevel || undefined,
                status: exportStatus || undefined,
                token: sessionToken,
            }
            : 'skip'
    );

    const exportEnrollmentsQuery = useQuery(
        api.functions.importExport.exportEnrollments,
        isExporting && exportType === 'enrollments' && exportSectionId && sessionToken
            ? {
                sectionId: exportSectionId as Id<'sections'>,
                token: sessionToken,
            }
            : 'skip'
    );

    // Download CSV when export query completes
    useEffect(() => {
        if (isExporting) {
            let csvData: string | undefined;

            if (exportType === 'students' && exportStudentsQuery) {
                csvData = exportStudentsQuery;
            } else if (exportType === 'courses' && exportCoursesQuery) {
                csvData = exportCoursesQuery;
            } else if (exportType === 'enrollments' && exportEnrollmentsQuery) {
                csvData = exportEnrollmentsQuery;
            }

            if (csvData) {
                // Create blob and download
                const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                const dateStr = new Date().toISOString().split('T')[0];
                link.setAttribute('href', url);
                link.setAttribute('download', `${exportType}_export_${dateStr}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                setAlertMessage({
                    variant: 'success',
                    title: 'Export Successful',
                    message: `${exportType} data exported successfully`,
                });
                setTimeout(() => setAlertMessage(null), 5000);
                setIsExporting(false);

                // Call success callback
                if (onExportComplete) {
                    onExportComplete();
                }
            }
        }
    }, [
        exportStudentsQuery,
        exportCoursesQuery,
        exportEnrollmentsQuery,
        isExporting,
        exportType,
        onExportComplete,
    ]);

    // Handle export
    const handleExport = () => {
        if (exportType === 'enrollments' && !exportSectionId) {
            setAlertMessage({
                variant: 'error',
                title: 'Section Required',
                message: 'Please select a section for enrollment export',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        setIsExporting(true);
        setAlertMessage(null);
    };

    // Reset filters when export type changes
    const handleExportTypeChange = (newType: typeof exportType) => {
        setExportType(newType);
        setExportDepartmentId('');
        setExportSectionId('');
        setExportStatus('');
        setExportLevel('');
        setAlertMessage(null);
    };

    const departmentOptions =
        departments?.map((dept) => ({
            value: dept._id,
            label: dept.name,
        })) || [];

    const sectionOptions =
        sectionsData?.map((section) => ({
            value: section._id,
            label: `${section.courseCode || 'N/A'} - ${section.courseTitle || 'Untitled'}`,
        })) || [];

    return (
        <div className="space-y-6">
            {alertMessage && (
                <Alert
                    variant={alertMessage.variant}
                    title={alertMessage.title}
                    message={alertMessage.message}
                />
            )}

            <ComponentCard
                title="Export Data"
                desc="Export students, courses, or enrollments to CSV files"
            >
                <div className="space-y-6">
                    {/* Export Type Selection */}
                    <div>
                        <Label>Export Type</Label>
                        <Select
                            options={[
                                { value: 'students', label: 'Students' },
                                { value: 'courses', label: 'Courses' },
                                { value: 'enrollments', label: 'Enrollments' },
                            ]}
                            defaultValue={exportType}
                            onChange={(e) => handleExportTypeChange(e.target.value as typeof exportType)}
                            disabled={isExporting}
                        />
                    </div>

                    {/* Department Filter (for students and courses) */}
                    {exportType !== 'enrollments' && (
                        <div>
                            <Label>Department (Optional)</Label>
                            <Select
                                options={[
                                    { value: '', label: 'All Departments' },
                                    ...departmentOptions,
                                ]}
                                defaultValue={exportDepartmentId}
                                onChange={(e) => setExportDepartmentId(e.target.value)}
                                disabled={isExporting}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Leave empty to export from all departments
                            </p>
                        </div>
                    )}

                    {/* Section Selection (for enrollments) */}
                    {exportType === 'enrollments' && (
                        <div>
                            <Label>Section *</Label>
                            <Select
                                options={[
                                    { value: '', label: 'Select Section' },
                                    ...sectionOptions,
                                ]}
                                defaultValue={exportSectionId}
                                onChange={(e) => setExportSectionId(e.target.value)}
                                disabled={isExporting}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Select a section to export enrollments
                            </p>
                        </div>
                    )}

                    {/* Status Filter (for students) */}
                    {exportType === 'students' && (
                        <div>
                            <Label>Status (Optional)</Label>
                            <Select
                                options={[
                                    { value: '', label: 'All Statuses' },
                                    { value: 'active', label: 'Active' },
                                    { value: 'suspended', label: 'Suspended' },
                                    { value: 'graduated', label: 'Graduated' },
                                    { value: 'inactive', label: 'Inactive' },
                                ]}
                                defaultValue={exportStatus}
                                onChange={(e) => setExportStatus(e.target.value)}
                                disabled={isExporting}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Filter students by status
                            </p>
                        </div>
                    )}

                    {/* Level Filter (for students and courses) */}
                    {(exportType === 'students' || exportType === 'courses') && (
                        <div>
                            <Label>Level (Optional)</Label>
                            <Select
                                options={[
                                    { value: '', label: 'All Levels' },
                                    { value: '100', label: '100 Level' },
                                    { value: '200', label: '200 Level' },
                                    { value: '300', label: '300 Level' },
                                    { value: '400', label: '400 Level' },
                                    { value: '500', label: '500 Level' },
                                ]}
                                defaultValue={exportLevel}
                                onChange={(e) => setExportLevel(e.target.value)}
                                disabled={isExporting}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Filter by academic level
                            </p>
                        </div>
                    )}

                    {/* Course Status Filter (for courses) */}
                    {exportType === 'courses' && (
                        <div>
                            <Label>Course Status (Optional)</Label>
                            <Select
                                options={[
                                    { value: '', label: 'All Statuses' },
                                    { value: 'C', label: 'Core' },
                                    { value: 'R', label: 'Required' },
                                    { value: 'E', label: 'Elective' },
                                ]}
                                defaultValue={exportStatus}
                                onChange={(e) => setExportStatus(e.target.value)}
                                disabled={isExporting}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Filter courses by type (Core, Required, or Elective)
                            </p>
                        </div>
                    )}

                    {/* Export Button */}
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleExport}
                            disabled={isExporting || (exportType === 'enrollments' && !exportSectionId)}
                            startIcon={<DownloadIcon />}
                            size="md"
                        >
                            {isExporting ? 'Exporting...' : 'Export to CSV'}
                        </Button>
                        {isExporting && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Preparing export...
                            </span>
                        )}
                    </div>

                    {/* Progress Indicator */}
                    {isExporting && (
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Exporting {exportType} data...
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Export Info */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                        <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                            Export Information
                        </h4>
                        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                            <li>
                                • The exported CSV file will be downloaded automatically when ready
                            </li>
                            <li>
                                • File name format: <code className="rounded bg-gray-200 px-1 py-0.5 dark:bg-gray-700">
                                    {exportType}_export_YYYY-MM-DD.csv
                                </code>
                            </li>
                            {exportType === 'students' && (
                                <>
                                    <li>• Exported columns: studentId, studentNumber, email, firstName, middleName, lastName, admissionYear, level, status, academicStanding, departmentId</li>
                                    <li>• Filters are applied: {exportDepartmentId ? 'Department' : ''} {exportStatus ? 'Status' : ''} {exportLevel ? 'Level' : ''}</li>
                                </>
                            )}
                            {exportType === 'courses' && (
                                <>
                                    <li>• Exported columns: courseId, code, title, description, credits, prerequisites, departmentId, programIds, status, level</li>
                                    <li>• Filters are applied: {exportDepartmentId ? 'Department' : ''} {exportLevel ? 'Level' : ''} {exportStatus ? 'Status' : ''}</li>
                                </>
                            )}
                            {exportType === 'enrollments' && (
                                <>
                                    <li>• Exported columns: enrollmentId, studentId, studentNumber, sectionId, courseCode, courseTitle, status, enrolledAt, grade, term, termId, sessionId</li>
                                    <li>• Exporting enrollments for selected section only</li>
                                </>
                            )}
                        </ul>
                    </div>
                </div>
            </ComponentCard>
        </div>
    );
}

