/**
 * Import/Export Functions
 * 
 * Provides mutations for CSV import operations and queries for export operations.
 * Includes validation endpoints and comprehensive error handling with partial import support.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import {
    parseCSV,
    validateStudentData,
    validateCourseData,
    importStudentsFromCSV,
    importCoursesFromCSV,
    importEnrollmentsFromCSV,
    exportStudentsToCSV,
    exportCoursesToCSV,
    exportEnrollmentsToCSV,
} from "../lib/services/importExportService";
import { validateSessionToken } from "../lib/session";

// ============================================================================
// Validation Queries
// ============================================================================

/**
 * Validate student CSV data without importing
 * 
 * @returns Validation results with detailed errors for each row
 */
export const validateStudentCSV = query({
    args: {
        csvContent: v.string(),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Optional: Validate session token for authentication
        if (args.token) {
            const userId = await validateSessionToken(ctx.db, args.token);
            if (!userId) {
                throw new Error("Invalid session token");
            }
        }

        // Parse CSV
        const csvData = parseCSV(args.csvContent);

        if (csvData.length === 0) {
            return {
                isValid: false,
                totalRows: 0,
                validRows: 0,
                invalidRows: 0,
                errors: [{ row: 0, errors: ["CSV is empty or invalid"] }],
            };
        }

        // Validate each row
        const validationResults: Array<{
            row: number;
            data: Record<string, string>;
            isValid: boolean;
            errors: string[];
        }> = [];

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const rowNumber = i + 2; // +2 because CSV has header and is 1-indexed
            const validation = validateStudentData(row);

            validationResults.push({
                row: rowNumber,
                data: row,
                isValid: validation.isValid,
                errors: validation.errors,
            });
        }

        const validRows = validationResults.filter((r) => r.isValid).length;
        const invalidRows = validationResults.filter((r) => !r.isValid).length;

        return {
            isValid: invalidRows === 0,
            totalRows: csvData.length,
            validRows,
            invalidRows,
            results: validationResults,
        };
    },
});

/**
 * Validate course CSV data without importing
 * 
 * @returns Validation results with detailed errors for each row
 */
export const validateCourseCSV = query({
    args: {
        csvContent: v.string(),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Optional: Validate session token for authentication
        if (args.token) {
            const userId = await validateSessionToken(ctx.db, args.token);
            if (!userId) {
                throw new Error("Invalid session token");
            }
        }

        // Parse CSV
        const csvData = parseCSV(args.csvContent);

        if (csvData.length === 0) {
            return {
                isValid: false,
                totalRows: 0,
                validRows: 0,
                invalidRows: 0,
                errors: [{ row: 0, errors: ["CSV is empty or invalid"] }],
            };
        }

        // Validate each row
        const validationResults: Array<{
            row: number;
            data: Record<string, string>;
            isValid: boolean;
            errors: string[];
        }> = [];

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const rowNumber = i + 2; // +2 because CSV has header and is 1-indexed
            const validation = validateCourseData(row);

            validationResults.push({
                row: rowNumber,
                data: row,
                isValid: validation.isValid,
                errors: validation.errors,
            });
        }

        const validRows = validationResults.filter((r) => r.isValid).length;
        const invalidRows = validationResults.filter((r) => !r.isValid).length;

        return {
            isValid: invalidRows === 0,
            totalRows: csvData.length,
            validRows,
            invalidRows,
            results: validationResults,
        };
    },
});

/**
 * Validate enrollment CSV data without importing
 * 
 * @returns Validation results with detailed errors for each row
 */
export const validateEnrollmentCSV = query({
    args: {
        csvContent: v.string(),
        sectionId: v.id("sections"),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Optional: Validate session token for authentication
        if (args.token) {
            const userId = await validateSessionToken(ctx.db, args.token);
            if (!userId) {
                throw new Error("Invalid session token");
            }
        }

        // Verify section exists
        const section = await ctx.db.get(args.sectionId);
        if (!section) {
            throw new Error(`Section not found: ${args.sectionId}`);
        }

        // Parse CSV
        const csvData = parseCSV(args.csvContent);

        if (csvData.length === 0) {
            return {
                isValid: false,
                totalRows: 0,
                validRows: 0,
                invalidRows: 0,
                errors: [{ row: 0, errors: ["CSV is empty or invalid"] }],
            };
        }

        // Validate each row
        const validationResults: Array<{
            row: number;
            data: Record<string, string>;
            isValid: boolean;
            errors: string[];
        }> = [];

        for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const rowNumber = i + 2; // +2 because CSV has header and is 1-indexed
            const errors: string[] = [];

            // Required field: studentNumber or studentId
            const studentIdentifier = row.studentNumber || row.studentId;
            if (!studentIdentifier || studentIdentifier.trim().length === 0) {
                errors.push("Missing required field: studentNumber or studentId");
            } else {
                // Check if student exists
                let studentId: Id<"students"> | null = null;

                if (row.studentId) {
                    try {
                        const student = await ctx.db.get(row.studentId as Id<"students">);
                        if (student) {
                            studentId = student._id;
                        }
                    } catch {
                        // Invalid ID format
                    }
                }

                if (!studentId && row.studentNumber) {
                    const student = await ctx.db
                        .query("students")
                        .withIndex("by_studentNumber", (q) => q.eq("studentNumber", row.studentNumber.trim()))
                        .first();
                    if (student) {
                        studentId = student._id;
                    }
                }

                if (!studentId) {
                    errors.push(`Student not found: ${studentIdentifier}`);
                } else {
                    // Check if enrollment already exists
                    const existingEnrollment = await ctx.db
                        .query("enrollments")
                        .withIndex("by_studentId_sectionId", (q) =>
                            q.eq("studentId", studentId!).eq("sectionId", args.sectionId)
                        )
                        .first();

                    if (existingEnrollment) {
                        errors.push("Student already enrolled in this section");
                    }

                    // Check section capacity
                    if (section.enrollmentCount >= section.capacity) {
                        errors.push("Section is at full capacity");
                    }
                }
            }

            // Validate status if provided
            if (row.status) {
                const validStatuses = ["enrolled", "active", "completed", "dropped", "withdrawn"];
                if (!validStatuses.includes(row.status.trim().toLowerCase())) {
                    errors.push(
                        `Invalid status: ${row.status}. Must be one of: ${validStatuses.join(", ")}`
                    );
                }
            }

            validationResults.push({
                row: rowNumber,
                data: row,
                isValid: errors.length === 0,
                errors,
            });
        }

        const validRows = validationResults.filter((r) => r.isValid).length;
        const invalidRows = validationResults.filter((r) => !r.isValid).length;

        return {
            isValid: invalidRows === 0,
            totalRows: csvData.length,
            validRows,
            invalidRows,
            results: validationResults,
        };
    },
});

// ============================================================================
// Import Mutations
// ============================================================================

/**
 * Import students from CSV with partial import support
 * 
 * @returns Import results with detailed success/failure information
 */
export const importStudents = mutation({
    args: {
        csvContent: v.string(),
        departmentId: v.id("departments"),
        token: v.optional(v.string()),
        allowPartialImport: v.optional(v.boolean()), // Default: true
    },
    handler: async (ctx, args) => {
        // Validate session token
        if (args.token) {
            const userId = await validateSessionToken(ctx.db, args.token);
            if (!userId) {
                throw new Error("Invalid session token");
            }

            // Check if user has permission (admin, registrar, etc.)
            const user = await ctx.db.get(userId);
            if (!user || (!user.roles.includes("admin") && !user.roles.includes("registrar"))) {
                throw new Error("Access denied: Admin or Registrar role required");
            }
        }

        const allowPartial = args.allowPartialImport !== false; // Default to true

        try {
            // Parse CSV
            const csvData = parseCSV(args.csvContent);

            if (csvData.length === 0) {
                return {
                    success: false,
                    error: "CSV is empty or invalid",
                    totalRows: 0,
                    imported: 0,
                    failed: 0,
                    errors: [],
                };
            }

            // Perform import with error tracking
            const result = await importStudentsFromCSV(ctx.db, csvData, args.departmentId);

            // If partial import is not allowed and there are failures, throw error
            if (!allowPartial && result.failed > 0) {
                throw new Error(
                    `Import failed: ${result.failed} row(s) had errors. Partial import is disabled.`
                );
            }

            return {
                success: result.success > 0 || allowPartial,
                totalRows: csvData.length,
                imported: result.success,
                failed: result.failed,
                errors: result.errors,
                message: allowPartial
                    ? `Imported ${result.success} of ${csvData.length} students. ${result.failed} failed.`
                    : result.failed === 0
                        ? `Successfully imported ${result.success} students.`
                        : `Import completed with errors: ${result.success} imported, ${result.failed} failed.`,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            // Critical error - transaction will rollback automatically in Convex
            return {
                success: false,
                error: errorMessage,
                totalRows: 0,
                imported: 0,
                failed: 0,
                errors: [{ row: 0, errors: [errorMessage] }],
            };
        }
    },
});

/**
 * Import courses from CSV with partial import support
 * 
 * @returns Import results with detailed success/failure information
 */
export const importCourses = mutation({
    args: {
        csvContent: v.string(),
        departmentId: v.id("departments"),
        token: v.optional(v.string()),
        allowPartialImport: v.optional(v.boolean()), // Default: true
    },
    handler: async (ctx, args) => {
        // Validate session token
        if (args.token) {
            const userId = await validateSessionToken(ctx.db, args.token);
            if (!userId) {
                throw new Error("Invalid session token");
            }

            // Check if user has permission (admin, registrar, etc.)
            const user = await ctx.db.get(userId);
            if (!user || (!user.roles.includes("admin") && !user.roles.includes("registrar"))) {
                throw new Error("Access denied: Admin or Registrar role required");
            }
        }

        const allowPartial = args.allowPartialImport !== false; // Default to true

        try {
            // Parse CSV
            const csvData = parseCSV(args.csvContent);

            if (csvData.length === 0) {
                return {
                    success: false,
                    error: "CSV is empty or invalid",
                    totalRows: 0,
                    imported: 0,
                    failed: 0,
                    errors: [],
                };
            }

            // Perform import with error tracking
            const result = await importCoursesFromCSV(ctx.db, csvData, args.departmentId);

            // If partial import is not allowed and there are failures, throw error
            if (!allowPartial && result.failed > 0) {
                throw new Error(
                    `Import failed: ${result.failed} row(s) had errors. Partial import is disabled.`
                );
            }

            return {
                success: result.success > 0 || allowPartial,
                totalRows: csvData.length,
                imported: result.success,
                failed: result.failed,
                errors: result.errors,
                message: allowPartial
                    ? `Imported ${result.success} of ${csvData.length} courses. ${result.failed} failed.`
                    : result.failed === 0
                        ? `Successfully imported ${result.success} courses.`
                        : `Import completed with errors: ${result.success} imported, ${result.failed} failed.`,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            // Critical error - transaction will rollback automatically in Convex
            return {
                success: false,
                error: errorMessage,
                totalRows: 0,
                imported: 0,
                failed: 0,
                errors: [{ row: 0, errors: [errorMessage] }],
            };
        }
    },
});

/**
 * Import enrollments from CSV with partial import support
 * 
 * @returns Import results with detailed success/failure information
 */
export const importEnrollments = mutation({
    args: {
        csvContent: v.string(),
        sectionId: v.id("sections"),
        token: v.optional(v.string()),
        allowPartialImport: v.optional(v.boolean()), // Default: true
    },
    handler: async (ctx, args) => {
        // Validate session token
        if (args.token) {
            const userId = await validateSessionToken(ctx.db, args.token);
            if (!userId) {
                throw new Error("Invalid session token");
            }

            // Check if user has permission (admin, registrar, instructor, etc.)
            const user = await ctx.db.get(userId);
            if (
                !user ||
                (!user.roles.includes("admin") &&
                    !user.roles.includes("registrar") &&
                    !user.roles.includes("instructor"))
            ) {
                throw new Error("Access denied: Admin, Registrar, or Instructor role required");
            }

            // If instructor, verify they own the section
            if (user.roles.includes("instructor") && !user.roles.includes("admin") && !user.roles.includes("registrar")) {
                const section = await ctx.db.get(args.sectionId);
                if (!section || section.instructorId !== userId) {
                    throw new Error("Access denied: You can only import enrollments for your own sections");
                }
            }
        }

        const allowPartial = args.allowPartialImport !== false; // Default to true

        try {
            // Parse CSV
            const csvData = parseCSV(args.csvContent);

            if (csvData.length === 0) {
                return {
                    success: false,
                    error: "CSV is empty or invalid",
                    totalRows: 0,
                    imported: 0,
                    failed: 0,
                    errors: [],
                };
            }

            // Perform import with error tracking
            const result = await importEnrollmentsFromCSV(ctx.db, csvData, args.sectionId);

            // If partial import is not allowed and there are failures, throw error
            if (!allowPartial && result.failed > 0) {
                throw new Error(
                    `Import failed: ${result.failed} row(s) had errors. Partial import is disabled.`
                );
            }

            return {
                success: result.success > 0 || allowPartial,
                totalRows: csvData.length,
                imported: result.success,
                failed: result.failed,
                errors: result.errors,
                message: allowPartial
                    ? `Imported ${result.success} of ${csvData.length} enrollments. ${result.failed} failed.`
                    : result.failed === 0
                        ? `Successfully imported ${result.success} enrollments.`
                        : `Import completed with errors: ${result.success} imported, ${result.failed} failed.`,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            // Critical error - transaction will rollback automatically in Convex
            return {
                success: false,
                error: errorMessage,
                totalRows: 0,
                imported: 0,
                failed: 0,
                errors: [{ row: 0, errors: [errorMessage] }],
            };
        }
    },
});

// ============================================================================
// Export Queries
// ============================================================================

/**
 * Export students to CSV
 * 
 * @returns CSV string with student data
 */
export const exportStudents = query({
    args: {
        departmentId: v.optional(v.id("departments")),
        status: v.optional(v.string()),
        level: v.optional(v.string()),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Optional: Validate session token for authentication
        if (args.token) {
            const userId = await validateSessionToken(ctx.db, args.token);
            if (!userId) {
                throw new Error("Invalid session token");
            }

            // Check if user has permission
            const user = await ctx.db.get(userId);
            if (!user || (!user.roles.includes("admin") && !user.roles.includes("registrar"))) {
                throw new Error("Access denied: Admin or Registrar role required");
            }
        }

        const filters = {
            departmentId: args.departmentId,
            status: args.status,
            level: args.level,
        };

        return await exportStudentsToCSV(ctx.db, filters);
    },
});

/**
 * Export courses to CSV
 * 
 * @returns CSV string with course data
 */
export const exportCourses = query({
    args: {
        departmentId: v.optional(v.id("departments")),
        level: v.optional(v.string()),
        status: v.optional(v.string()),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Optional: Validate session token for authentication
        if (args.token) {
            const userId = await validateSessionToken(ctx.db, args.token);
            if (!userId) {
                throw new Error("Invalid session token");
            }

            // Check if user has permission
            const user = await ctx.db.get(userId);
            if (!user || (!user.roles.includes("admin") && !user.roles.includes("registrar"))) {
                throw new Error("Access denied: Admin or Registrar role required");
            }
        }

        const filters = {
            departmentId: args.departmentId,
            level: args.level,
            status: args.status,
        };

        return await exportCoursesToCSV(ctx.db, filters);
    },
});

/**
 * Export enrollments to CSV
 * 
 * @returns CSV string with enrollment data
 */
export const exportEnrollments = query({
    args: {
        sectionId: v.id("sections"),
        token: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Optional: Validate session token for authentication
        if (args.token) {
            const userId = await validateSessionToken(ctx.db, args.token);
            if (!userId) {
                throw new Error("Invalid session token");
            }

            // Check if user has permission
            const user = await ctx.db.get(userId);
            if (
                !user ||
                (!user.roles.includes("admin") &&
                    !user.roles.includes("registrar") &&
                    !user.roles.includes("instructor"))
            ) {
                throw new Error("Access denied: Admin, Registrar, or Instructor role required");
            }

            // If instructor, verify they own the section
            if (user.roles.includes("instructor") && !user.roles.includes("admin") && !user.roles.includes("registrar")) {
                const section = await ctx.db.get(args.sectionId);
                if (!section || section.instructorId !== userId) {
                    throw new Error("Access denied: You can only export enrollments for your own sections");
                }
            }
        }

        return await exportEnrollmentsToCSV(ctx.db, args.sectionId);
    },
});

