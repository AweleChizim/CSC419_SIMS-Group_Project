'use client';

import React from 'react';

type ValidationResult = {
    row: number;
    data?: Record<string, string>;
    isValid: boolean;
    errors: string[];
};

type ColumnDefinition = {
    key: string;
    label: string;
    render?: (value: any, row: Record<string, any>) => React.ReactNode;
    className?: string;
};

interface ImportPreviewProps {
    data: Record<string, any>[];
    validationResults?: {
        isValid: boolean;
        totalRows: number;
        validRows: number;
        invalidRows: number;
        results: ValidationResult[];
    } | null;
    columns: ColumnDefinition[];
    title?: string;
    maxPreviewRows?: number;
    showErrorDetails?: boolean;
}

export default function ImportPreview({
    data,
    validationResults,
    columns,
    title = 'Preview Data',
    maxPreviewRows = 10,
    showErrorDetails = true,
}: ImportPreviewProps) {
    if (data.length === 0) {
        return null;
    }

    const validRows = validationResults?.validRows || 0;
    const invalidRows = validationResults?.invalidRows || 0;
    const totalRows = validationResults?.totalRows || data.length;

    // Get validation status for each row
    const getRowValidation = (rowIndex: number): ValidationResult | null => {
        if (!validationResults) return null;
        const rowNumber = rowIndex + 2; // +2 because CSV has header and is 1-indexed
        return validationResults.results.find((r) => r.row === rowNumber) || null;
    };

    // Get all validation errors for display
    const validationErrors = validationResults?.results.filter((r) => !r.isValid) || [];

    return (
        <div className="space-y-4">
            {/* Summary Section */}
            {validationResults && (
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

                    {/* Validation Errors List */}
                    {showErrorDetails && invalidRows > 0 && (
                        <div className="mb-4 max-h-64 space-y-2 overflow-y-auto">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                                Validation Errors
                            </h4>
                            {validationErrors.map((result, idx) => (
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

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-800 dark:text-white/90">{totalRows}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Total Rows</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-success-700 dark:text-success-300">
                                {validRows}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Valid</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-error-700 dark:text-error-300">
                                {invalidRows}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Invalid</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Table */}
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        {title} ({data.length} row{data.length !== 1 ? 's' : ''})
                    </h3>
                    {validationResults && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {validRows > 0 && (
                                <span className="mr-3">
                                    <span className="inline-block h-3 w-3 rounded-full bg-success-500 mr-1"></span>
                                    Valid
                                </span>
                            )}
                            {invalidRows > 0 && (
                                <span>
                                    <span className="inline-block h-3 w-3 rounded-full bg-error-500 mr-1"></span>
                                    Invalid
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                    #
                                </th>
                                {columns.map((column) => (
                                    <th
                                        key={column.key}
                                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300 ${column.className || ''}`}
                                    >
                                        {column.label}
                                    </th>
                                ))}
                                {validationResults && (
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Status
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                            {data.slice(0, maxPreviewRows).map((row, idx) => {
                                const rowNumber = idx + 2; // +2 because CSV has header and is 1-indexed
                                const validation = getRowValidation(idx);
                                const isValid = validation ? validation.isValid : true;
                                const hasErrors = validation && !validation.isValid;

                                return (
                                    <tr
                                        key={idx}
                                        className={
                                            isValid
                                                ? 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                : 'bg-error-50 dark:bg-error-900/20 hover:bg-error-100 dark:hover:bg-error-900/30'
                                        }
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {rowNumber}
                                        </td>
                                        {columns.map((column) => {
                                            const value = row[column.key];
                                            const renderedValue = column.render
                                                ? column.render(value, row)
                                                : value || '-';

                                            return (
                                                <td
                                                    key={column.key}
                                                    className={`whitespace-nowrap px-4 py-3 text-sm text-gray-700 dark:text-gray-300 ${column.className || ''}`}
                                                >
                                                    {renderedValue}
                                                </td>
                                            );
                                        })}
                                        {validationResults && (
                                            <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                {isValid ? (
                                                    <span className="inline-flex items-center rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-800 dark:bg-success-900 dark:text-success-300">
                                                        Valid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-error-100 px-2.5 py-0.5 text-xs font-medium text-error-800 dark:bg-error-900 dark:text-error-300">
                                                        Invalid
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {data.length > maxPreviewRows && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Showing first {maxPreviewRows} rows of {data.length} total rows
                        </p>
                    )}
                </div>
            </div>

            {/* Row-level Error Tooltips (optional enhancement) */}
            {validationResults && invalidRows > 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
                        Quick Reference
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Rows highlighted in red contain validation errors. Check the validation summary above
                        for detailed error messages.
                    </p>
                </div>
            )}
        </div>
    );
}

