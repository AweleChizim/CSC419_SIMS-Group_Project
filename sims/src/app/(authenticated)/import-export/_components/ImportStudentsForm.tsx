'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { Id } from '@/lib/convex';
import ComponentCard from '@/components/common/ComponentCard';
import Button from '@/components/ui/button/Button';
import Alert from '@/components/ui/alert/Alert';
import Label from '@/components/form/Label';
import Select from '@/components/form/Select';
import FileInput from '@/components/form/input/FileInput';
import { Modal } from '@/components/ui/modal';
import { ArrowUpIcon, DownloadIcon } from '@/icons';
import { downloadStudentTemplate } from './csvTemplateUtils';

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

type ValidationResult = {
    row: number;
    data?: Record<string, string>;
    isValid: boolean;
    errors: string[];
};

type ParsedStudentData = {
    email: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    studentNumber: string;
    admissionYear?: string;
    level: string;
    status: string;
    academicStanding?: string;
};

interface ImportStudentsFormProps {
    onSuccess?: () => void;
}

export default function ImportStudentsForm({ onSuccess }: ImportStudentsFormProps) {
    const [sessionToken] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sims_session_token');
        }
        return null;
    });

    // Form state
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [csvContent, setCsvContent] = useState<string>('');
    const [parsedData, setParsedData] = useState<ParsedStudentData[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{
        variant: 'error' | 'success' | 'warning' | 'info';
        title: string;
        message: string;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch departments
    const departments = useQuery(
        api.functions.departments.list,
        sessionToken ? { token: sessionToken } : 'skip'
    ) as Department[] | undefined;

    // Validation query
    const validationResult = useQuery(
        api.functions.importExport.validateStudentCSV,
        isValidating && csvContent && sessionToken
            ? { csvContent, token: sessionToken }
            : 'skip'
    ) as {
        isValid: boolean;
        totalRows: number;
        validRows: number;
        invalidRows: number;
        results: ValidationResult[];
    } | undefined;

    // Import mutation
    const importStudentsMutation = useMutation(api.functions.importExport.importStudents);

    // Parse CSV and update parsed data when file changes
    useEffect(() => {
        if (csvContent) {
            parseCSVData(csvContent);
        }
    }, [csvContent]);

    // Update validation state when validation completes
    useEffect(() => {
        if (validationResult && isValidating) {
            setIsValidating(false);
        }
    }, [validationResult, isValidating]);

    // Parse CSV data for preview
    const parseCSVData = (content: string) => {
        const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length < 2) {
            setParsedData([]);
            return;
        }

        // Parse header
        const headers = parseCSVLine(lines[0]);
        const data: ParsedStudentData[] = [];

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0 || values.every((v) => !v || v.trim().length === 0)) {
                continue;
            }

            const row: Record<string, string> = {};
            headers.forEach((header, idx) => {
                row[header.trim()] = idx < values.length ? values[idx].trim() : '';
            });

            // Map to ParsedStudentData
            data.push({
                email: row.email || '',
                firstName: row.firstName || '',
                middleName: row.middleName,
                lastName: row.lastName || '',
                studentNumber: row.studentNumber || '',
                admissionYear: row.admissionYear,
                level: row.level || '',
                status: row.status || '',
                academicStanding: row.academicStanding,
            });
        }

        setParsedData(data);
    };

    // Helper to parse CSV line
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = i + 1 < line.length ? line[i + 1] : null;

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    };

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
        setAlertMessage(null);

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

        if (!selectedDepartmentId) {
            setAlertMessage({
                variant: 'error',
                title: 'Department Required',
                message: 'Please select a department',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        setIsValidating(true);
    };

    // Handle import confirmation
    const handleConfirmImport = async () => {
        if (!csvContent || !selectedDepartmentId) {
            return;
        }

        setShowConfirmModal(false);
        setIsImporting(true);

        try {
            const result = await importStudentsMutation({
                csvContent,
                departmentId: selectedDepartmentId as Id<'departments'>,
                token: sessionToken || undefined,
                allowPartialImport: true,
            });

            if (result.success) {
                setAlertMessage({
                    variant: 'success',
                    title: 'Import Successful',
                    message: result.message || `Successfully imported ${result.imported} student(s)`,
                });

                // Reset form
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                setSelectedFile(null);
                setCsvContent('');
                setParsedData([]);
                setSelectedDepartmentId('');

                // Call success callback
                if (onSuccess) {
                    setTimeout(() => {
                        onSuccess();
                    }, 2000);
                }
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
                message: error instanceof Error ? error.message : 'Failed to import students',
            });
            setTimeout(() => setAlertMessage(null), 8000);
        } finally {
            setIsImporting(false);
        }
    };

    // Open confirmation modal
    const handleImportClick = () => {
        if (!csvContent) {
            setAlertMessage({
                variant: 'error',
                title: 'No File Selected',
                message: 'Please select a CSV file first',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        if (!selectedDepartmentId) {
            setAlertMessage({
                variant: 'error',
                title: 'Department Required',
                message: 'Please select a department',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        if (!validationResult || validationResult.validRows === 0) {
            setAlertMessage({
                variant: 'warning',
                title: 'Validation Required',
                message: 'Please validate the CSV file first. No valid rows found.',
            });
            setTimeout(() => setAlertMessage(null), 5000);
            return;
        }

        setShowConfirmModal(true);
    };

    const departmentOptions =
        departments?.map((dept) => ({
            value: dept._id,
            label: dept.name,
        })) || [];

    const validRows = validationResult?.validRows || 0;
    const invalidRows = validationResult?.invalidRows || 0;
    const totalRows = validationResult?.totalRows || parsedData.length;

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
                title="Import Students"
                desc="Upload a CSV file to import students into the system"
            >
                <div className="space-y-6">
                    {/* Department Selection */}
                    <div>
                        <Label>Department *</Label>
                        <Select
                            options={[
                                { value: '', label: 'Select Department' },
                                ...departmentOptions,
                            ]}
                            defaultValue={selectedDepartmentId}
                            onChange={(e) => setSelectedDepartmentId(e.target.value)}
                            disabled={isImporting || isValidating}
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <Label>CSV File *</Label>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={downloadStudentTemplate}
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
                                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Required columns: email, firstName, lastName, studentNumber, level, status
                            <br />
                            Optional columns: middleName, admissionYear, academicStanding
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <Button
                            onClick={handleValidate}
                            disabled={!csvContent || !selectedDepartmentId || isImporting || isValidating}
                            variant="outline"
                        >
                            {isValidating ? 'Validating...' : 'Validate CSV'}
                        </Button>
                        <Button
                            onClick={handleImportClick}
                            disabled={
                                !csvContent ||
                                !selectedDepartmentId ||
                                isImporting ||
                                isValidating ||
                                !validationResult ||
                                validRows === 0
                            }
                            startIcon={<ArrowUpIcon />}
                        >
                            {isImporting ? 'Importing...' : 'Import Students'}
                        </Button>
                    </div>

                    {/* Progress Indicator */}
                    {(isValidating || isImporting) && (
                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-brand-500"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    {isValidating ? 'Validating CSV data...' : 'Importing students...'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Validation Results Summary */}
                    {validationResult && (
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    Validation Summary
                                </h3>
                                <div className="flex gap-2">
                                    <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-900 dark:text-success-300">
                                        {validRows} Valid
                                    </span>
                                    {invalidRows > 0 && (
                                        <span className="rounded-full bg-error-100 px-3 py-1 text-xs font-medium text-error-700 dark:bg-error-900 dark:text-error-300">
                                            {invalidRows} Invalid
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Validation Errors */}
                            {invalidRows > 0 && (
                                <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                        Validation Errors
                                    </h4>
                                    {validationResult.results
                                        .filter((r) => !r.isValid)
                                        .map((result, idx) => (
                                            <div
                                                key={idx}
                                                className="rounded border border-error-200 bg-error-50 p-3 dark:border-error-800 dark:bg-error-900/20"
                                            >
                                                <div className="text-sm font-medium text-error-800 dark:text-error-300">
                                                    Row {result.row}:
                                                </div>
                                                <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-error-700 dark:text-error-400">
                                                    {result.errors.map((error, errIdx) => (
                                                        <li key={errIdx}>{error}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview Data */}
                    {parsedData.length > 0 && (
                        <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                                    Preview Data ({parsedData.length} row{parsedData.length !== 1 ? 's' : ''})
                                </h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                #
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Email
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Name
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Student Number
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Level
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                                        {parsedData.slice(0, 10).map((student, idx) => {
                                            const rowNumber = idx + 2; // +2 because CSV has header and is 1-indexed
                                            const isValid = validationResult?.results.find((r) => r.row === rowNumber)
                                                ?.isValid ?? true;

                                            return (
                                                <tr
                                                    key={idx}
                                                    className={
                                                        isValid
                                                            ? ''
                                                            : 'bg-error-50 dark:bg-error-900/20'
                                                    }
                                                >
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {rowNumber}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {student.email || '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {`${student.firstName} ${student.middleName || ''} ${student.lastName}`.trim()}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {student.studentNumber || '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {student.level || '-'}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                                                        {student.status || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {parsedData.length > 10 && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        Showing first 10 rows of {parsedData.length} total rows
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </ComponentCard>

            {/* Confirmation Modal */}
            <Modal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                className="max-w-[600px] p-6 lg:p-10"
            >
                <div className="space-y-4">
                    <h4 className="text-title-sm font-semibold text-gray-800 dark:text-white/90">
                        Confirm Import
                    </h4>

                    <div className="space-y-3">
                        <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                            You are about to import <strong>{validRows}</strong> student(s) into the system.
                        </p>

                        {invalidRows > 0 && (
                            <Alert
                                variant="warning"
                                title="Partial Import"
                                message={`${invalidRows} row(s) have validation errors and will be skipped. Only valid rows will be imported.`}
                            />
                        )}

                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Total Rows:</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">{totalRows}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Valid Rows:</span>
                                    <span className="font-medium text-success-700 dark:text-success-300">
                                        {validRows}
                                    </span>
                                </div>
                                {invalidRows > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Invalid Rows:</span>
                                        <span className="font-medium text-error-700 dark:text-error-300">
                                            {invalidRows}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Department:</span>
                                    <span className="font-medium text-gray-800 dark:text-white/90">
                                        {departments?.find((d) => d._id === selectedDepartmentId)?.name || 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            This action cannot be undone. Please ensure all data is correct before proceeding.
                        </p>
                    </div>

                    <div className="mt-8 flex w-full items-center justify-end gap-3">
                        <Button size="sm" variant="outline" onClick={() => setShowConfirmModal(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleConfirmImport} disabled={isImporting}>
                            {isImporting ? 'Importing...' : 'Confirm Import'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

