'use client';

import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { Id } from '@/lib/convex';
import PageBreadCrumb from '@/components/common/PageBreadCrumb';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Input from '@/components/form/input/InputField';
import Select from '@/components/form/Select';
import Label from '@/components/form/Label';
import Tabs from '@/components/ui/tabs/Tabs';
import TabPane from '@/components/ui/tabs/TabPane';
import FileInput from '@/components/form/input/FileInput';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { DownloadIcon, ArrowUpIcon } from '@/icons';
import { downloadStudentTemplate, downloadCourseTemplate, downloadEnrollmentTemplate } from './_components/csvTemplateUtils';

// Put this at the top of your file

interface ValidationResult {
  row: number;
  data: Record<string, string>;
  isValid: boolean;
  errors: string[];
}

interface ValidationError {
  row: number;
  errors: string[];
}

type ValidationPreview =
  | {
      isValid: true;
      totalRows: number;
      validRows: number;
      invalidRows: number;
      results: ValidationResult[];
    }
  | {
      isValid: false;
      totalRows: number;
      validRows: number;
      invalidRows: number;
      errors: ValidationError[];
    };


// Extended FileInput with accept and disabled props
const FileInputWithAccept = React.forwardRef<
    HTMLInputElement,
    React.ComponentProps<typeof FileInput> & { accept?: string; disabled?: boolean }
>(({ accept, disabled, ...props }, ref) => {
    return (
        <input
            ref={ref}
            type="file"
            accept={accept}
            disabled={disabled}
            className={`focus:border-ring-brand-300 shadow-theme-xs focus:file:ring-brand-300 h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 transition-colors file:mr-5 file:border-collapse file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-solid file:border-gray-200 file:bg-gray-50 file:py-3 file:pr-3 file:pl-3.5 file:text-sm file:text-gray-700 placeholder:text-gray-400 hover:file:bg-gray-100 focus:outline-hidden dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:text-white/90 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400 dark:placeholder:text-gray-400 ${props.className || ''}`}
            onChange={props.onChange}
        />
    );
});
FileInputWithAccept.displayName = 'FileInputWithAccept';

type Department = {
    _id: Id<'departments'>;
    name: string;
};




type ImportResult = {
    success: boolean;
    error?: string;
    totalRows: number;
    imported: number;
    failed: number;
    errors: Array<{ row: number; errors: string[] }>;
    message?: string;
};

export default function ImportExportPage() {
    const [sessionToken] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sims_session_token');
        }
        return null;
    });

    // Active tab state
    const [activeTab, setActiveTab] = useState(0);

    // Import state
    const [importType, setImportType] = useState<'students' | 'courses' | 'enrollments'>('students');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [csvContent, setCsvContent] = useState<string>('');
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
    const [selectedSectionId, setSelectedSectionId] = useState<string>('');
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationPreview | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [alertMessage, setAlertMessage] = useState<{
        variant: 'error' | 'success' | 'warning' | 'info';
        title: string;
        message: string;
    } | null>(null);

    // Export state
    const [exportType, setExportType] = useState<'students' | 'courses' | 'enrollments'>('students');
    const [exportDepartmentId, setExportDepartmentId] = useState<string>('');
    const [exportSectionId, setExportSectionId] = useState<string>('');
    const [exportStatus, setExportStatus] = useState<string>('');
    const [exportLevel, setExportLevel] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch departments
    const departments = useQuery(
        api.functions.departments.list,
        sessionToken ? {} : 'skip'
    ) as Department[] | undefined;

    // Fetch sections for enrollment import/export (using registrar query for admin access)
    const sectionsData = useQuery(
        api.functions.registrar.getAllSectionsStatus,
        sessionToken ? { token: sessionToken } : 'skip'
    ) as Array<{
        _id: Id<'sections'>;
        courseCode: string;
        courseTitle: string;
    }> | undefined;

    // Validation queries
    const validateStudentCSV = useQuery(
    api.functions.importExport.validateStudentCSV,
    isValidating && csvContent && importType === 'students'
        ? { csvContent }
        : 'skip'
    );

    const validateCourseCSV = useQuery(
        api.functions.importExport.validateCourseCSV,
        isValidating && csvContent && importType === 'courses'
            ? { csvContent }
            : 'skip'
    );

    const validateEnrollmentCSV = useQuery(
        api.functions.importExport.validateEnrollmentCSV,
        isValidating && csvContent && importType === 'enrollments' && selectedSectionId
            ? { csvContent, sectionId: selectedSectionId as Id<'sections'> }
            : 'skip'
    );


    // Import mutations
    const importStudentsMutation = useMutation(api.functions.importExport.importStudents);
    const importCoursesMutation = useMutation(api.functions.importExport.importCourses);
    const importEnrollmentsMutation = useMutation(api.functions.importExport.importEnrollments);

    // Export queries (we'll trigger them manually)
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

    // Handle file selection
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.name.endsWith('.csv')) {
            setAlertMessage({
                variant: 'error',
                title: 'Invalid File Type',
                message: 'Please upload a CSV file (.csv)',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        setSelectedFile(file);
        setValidationResult(null);
        setImportResult(null);

        try {
            const text = await file.text();
            setCsvContent(text);
        } catch (error) {
            setAlertMessage({
                variant: 'error',
                title: 'Error Reading File',
                message: error instanceof Error ? error.message : 'Failed to read file',
            });
            setTimeout(() => setAlertMessage(null), 5000);
        }
    };

    // Handle validation
    const handleValidate = () => {
        if (!csvContent) {
            setAlertMessage({
                variant: 'error',
                title: 'No File Selected',
                message: 'Please select a CSV file first',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        if (importType === 'enrollments' && !selectedSectionId) {
            setAlertMessage({
                variant: 'error',
                title: 'Section Required',
                message: 'Please select a section for enrollment import',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        setIsValidating(true);
        setValidationResult(null);
    };

    // Update validation result when query completes
    React.useEffect(() => {
    if (!isValidating) return;

    const result =
        importType === 'students'
            ? validateStudentCSV
            : importType === 'courses'
            ? validateCourseCSV
            : validateEnrollmentCSV;

    if (!result) return;

    if (result.isValid) {
    setValidationResult({
        isValid: true,
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        results: result.results ?? [],   // ✅ fallback to empty array
    });
    } else {
    setValidationResult({
        isValid: false,
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        errors: result.errors ?? [],     // ✅ fallback to empty array
    });
    }

    setIsValidating(false);
    }, [
        isValidating,
        importType,
        validateStudentCSV,
        validateCourseCSV,
        validateEnrollmentCSV,
    ]);


    // Handle import
    const handleImport = async () => {
        if (!csvContent) {
            setAlertMessage({
                variant: 'error',
                title: 'No File Selected',
                message: 'Please select a CSV file first',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        if (importType !== 'enrollments' && !selectedDepartmentId) {
            setAlertMessage({
                variant: 'error',
                title: 'Department Required',
                message: 'Please select a department',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        if (importType === 'enrollments' && !selectedSectionId) {
            setAlertMessage({
                variant: 'error',
                title: 'Section Required',
                message: 'Please select a section for enrollment import',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        setIsImporting(true);
        setImportResult(null);

        try {
            let result: ImportResult;

            if (importType === 'students') {
                result = await importStudentsMutation({
                    csvContent,
                    departmentId: selectedDepartmentId as Id<'departments'>,
                    token: sessionToken || undefined,
                    allowPartialImport: true,
                });
            } else if (importType === 'courses') {
                result = await importCoursesMutation({
                    csvContent,
                    departmentId: selectedDepartmentId as Id<'departments'>,
                    token: sessionToken || undefined,
                    allowPartialImport: true,
                });
            } else {
                result = await importEnrollmentsMutation({
                    csvContent,
                    sectionId: selectedSectionId as Id<'sections'>,
                    token: sessionToken || undefined,
                    allowPartialImport: true,
                });
            }

            setImportResult(result);

            if (result.success) {
                setAlertMessage({
                    variant: 'success',
                    title: 'Import Successful',
                    message: result.message || `Successfully imported ${result.imported} record(s)`,
                });
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setSelectedFile(null);
                setCsvContent('');
                setValidationResult(null);
            } else {
                setAlertMessage({
                    variant: result.failed > 0 ? 'warning' : 'error',
                    title: 'Import Completed with Issues',
                    message: result.error || result.message || 'Import completed with errors',
                });
            }

            setTimeout(() => setAlertMessage(null), 8000);
        } catch (error) {
            setAlertMessage({
                variant: 'error',
                title: 'Import Failed',
                message: error instanceof Error ? error.message : 'Failed to import data',
            });
            setTimeout(() => setAlertMessage(null), 8000);
        } finally {
            setIsImporting(false);
        }
    };

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
    };

    // Download CSV when export query completes
    React.useEffect(() => {
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
                link.setAttribute('href', url);
                link.setAttribute('download', `${exportType}_export_${new Date().toISOString().split('T')[0]}.csv`);
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
            }
        }
    }, [exportStudentsQuery, exportCoursesQuery, exportEnrollmentsQuery, isExporting, exportType]);

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
        <RoleGuard
            role="admin"
            unauthorizedMessage="You must be an administrator to access this page."
        >
            <div>
                <PageBreadCrumb pageTitle="Import & Export" />

                <div className="space-y-6">
                    {alertMessage && (
                        <Alert
                            variant={alertMessage.variant}
                            title={alertMessage.title}
                            message={alertMessage.message}
                        />
                    )}

                    <Tabs
                        tabStyle="independent"
                        justifyTabs="left"
                        onChange={(index) => setActiveTab(index)}
                    >
                        {/* Import Tab */}
                        <TabPane tab="Import">
                            <ComponentCard
                                title="Import Data"
                                desc="Import students, courses, or enrollments from CSV files"
                            >
                                <div className="space-y-6">
                                    {/* Import Type Selection */}
                                    <div>
                                        <Label>Import Type</Label>
                                        <Select
                                            options={[
                                                { value: 'students', label: 'Students' },
                                                { value: 'courses', label: 'Courses' },
                                                { value: 'enrollments', label: 'Enrollments' },
                                            ]}
                                            defaultValue={importType}
                                            onChange={(e) => {
                                                setImportType(e.target.value as typeof importType);
                                                setValidationResult(null);
                                                setImportResult(null);
                                                setSelectedFile(null);
                                                setCsvContent('');
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Department Selection (for students and courses) */}
                                    {importType !== 'enrollments' && (
                                        <div>
                                            <Label>Department *</Label>
                                            <Select
                                                options={[
                                                    { value: '', label: 'Select Department' },
                                                    ...departmentOptions,
                                                ]}
                                                defaultValue={selectedDepartmentId}
                                                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* Section Selection (for enrollments) */}
                                    {importType === 'enrollments' && (
                                        <div>
                                            <Label>Section *</Label>
                                            <Select
                                                options={[
                                                    { value: '', label: 'Select Section' },
                                                    ...sectionOptions,
                                                ]}
                                                defaultValue={selectedSectionId}
                                                onChange={(e) => setSelectedSectionId(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* File Upload */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <Label>CSV File *</Label>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    if (importType === 'students') {
                                                        downloadStudentTemplate();
                                                    } else if (importType === 'courses') {
                                                        downloadCourseTemplate();
                                                    } else if (importType === 'enrollments') {
                                                        downloadEnrollmentTemplate();
                                                    }
                                                }}
                                                startIcon={<DownloadIcon />}
                                                disabled={isImporting || isValidating}
                                            >
                                                Download Template
                                            </Button>
                                        </div>
                                        <FileInputWithAccept
                                            ref={fileInputRef}
                                            accept=".csv"
                                            onChange={handleFileChange}
                                            disabled={isImporting || isValidating}
                                        />
                                        {selectedFile && (
                                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                Selected: {selectedFile.name}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                            {importType === 'students' && (
                                                <>
                                                    Required columns: email, firstName, lastName, studentNumber, level, status
                                                    <br />
                                                    Optional columns: middleName, admissionYear, academicStanding
                                                </>
                                            )}
                                            {importType === 'courses' && (
                                                <>
                                                    Required columns: code, title, description, credits, level
                                                    <br />
                                                    Optional columns: prerequisites (comma-separated), status (C/R/E), programIds (comma-separated)
                                                </>
                                            )}
                                            {importType === 'enrollments' && (
                                                <>
                                                    Required columns: studentNumber or studentId
                                                    <br />
                                                    Optional columns: status, grade, term
                                                </>
                                            )}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-4">
                                        <Button
                                            onClick={handleValidate}
                                            disabled={!csvContent || isImporting || isValidating}
                                            variant="outline"
                                        >
                                            {isValidating ? 'Validating...' : 'Validate CSV'}
                                        </Button>
                                        <Button
                                            onClick={handleImport}
                                            disabled={!csvContent || isImporting || isValidating}
                                            startIcon={<ArrowUpIcon />}
                                        >
                                            {isImporting ? 'Importing...' : 'Import Data'}
                                        </Button>
                                    </div>

                                    {/* Progress Indicator */}
                                    {(isValidating || isImporting) && (
                                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"></div>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    {isValidating ? 'Validating CSV data...' : 'Importing data...'}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Validation Results */}
                                    {validationResult && (
                                        <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                                    Validation Results
                                                </h3>
                                                <div className="flex gap-2">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-medium ${validationResult.isValid
                                                            ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                                                            : 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300'
                                                            }`}
                                                    >
                                                        {validationResult.validRows} Valid
                                                    </span>
                                                    {validationResult.invalidRows > 0 && (
                                                        <span className="rounded-full bg-error-100 px-3 py-1 text-xs font-medium text-error-700 dark:bg-error-900 dark:text-error-300">
                                                            {validationResult.invalidRows} Invalid
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {!validationResult.isValid &&
                                            validationResult.errors.map((error, idx) => (
                                                <div
                                                    key={idx}
                                                    className="rounded border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20"
                                                >
                                                    <div className="text-sm font-medium text-error-800 dark:text-error-300">
                                                        Row {error.row}:
                                                    </div>
                                                    <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-error-700 dark:text-error-400">
                                                        {error.errors.map((err, errIdx) => (
                                                            <li key={errIdx}>{err}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Import Results */}
                                    {importResult && (
                                        <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                                    Import Results
                                                </h3>
                                                <div className="flex gap-2">
                                                    <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-900 dark:text-success-300">
                                                        {importResult.imported} Imported
                                                    </span>
                                                    {importResult.failed > 0 && (
                                                        <span className="rounded-full bg-error-100 px-3 py-1 text-xs font-medium text-error-700 dark:bg-error-900 dark:text-error-300">
                                                            {importResult.failed} Failed
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {importResult.errors.length > 0 && (
                                                <div className="max-h-64 space-y-2 overflow-y-auto">
                                                    {importResult.errors.map((error, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="rounded border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20"
                                                        >
                                                            <div className="text-sm font-medium text-error-800 dark:text-error-300">
                                                                Row {error.row}:
                                                            </div>
                                                            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-error-700 dark:text-error-400">
                                                                {error.errors.map((err, errIdx) => (
                                                                    <li key={errIdx}>{err}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </ComponentCard>
                        </TabPane>

                        {/* Export Tab */}
                        <TabPane tab="Export">
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
                                            onChange={(e) => {
                                                setExportType(e.target.value as typeof exportType);
                                                setExportDepartmentId('');
                                                setExportSectionId('');
                                                setExportStatus('');
                                                setExportLevel('');
                                            }}
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
                                            />
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
                                            />
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
                                            />
                                        </div>
                                    )}

                                    {/* Level Filter */}
                                    {(exportType === 'students' || exportType === 'courses') && (
                                        <div>
                                            <Label>Level (Optional)</Label>
                                            <Select
                                                options={[
                                                    { value: '', label: 'All Levels' },
                                                    { value: '100', label: '100' },
                                                    { value: '200', label: '200' },
                                                    { value: '300', label: '300' },
                                                    { value: '400', label: '400' },
                                                    { value: '500', label: '500' },
                                                ]}
                                                defaultValue={exportLevel}
                                                onChange={(e) => setExportLevel(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* Status Filter (for courses) */}
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
                                            />
                                        </div>
                                    )}

                                    {/* Export Button */}
                                    <div>
                                        <Button
                                            onClick={handleExport}
                                            disabled={isExporting || (exportType === 'enrollments' && !exportSectionId)}
                                            startIcon={<DownloadIcon />}
                                        >
                                            {isExporting ? 'Exporting...' : 'Export to CSV'}
                                        </Button>
                                    </div>

                                    {/* Progress Indicator */}
                                    {isExporting && (
                                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                                            <div className="flex items-center gap-3">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"></div>
                                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                                    Exporting data...
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </ComponentCard>
                        </TabPane>
                    </Tabs>
                </div>
            </div>
        </RoleGuard>
    );
}

