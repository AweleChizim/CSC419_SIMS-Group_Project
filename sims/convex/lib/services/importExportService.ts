/**
 * Import/Export Service
 * 
 * Provides CSV import and export functionality for students, courses, and enrollments.
 */

import { DatabaseReader, DatabaseWriter } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

// ============================================================================
// CSV Parsing
// ============================================================================

/**
 * Parse CSV string to objects
 * 
 * @param csvContent - CSV string content
 * @returns Array of objects with keys from header row
 */
export function parseCSV(csvContent: string): Record<string, string>[] {
    if (!csvContent || csvContent.trim().length === 0) {
        return [];
    }

    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
        return [];
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);

    if (headers.length === 0) {
        return [];
    }

    // Parse data rows
    const results: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);

        // Skip empty rows
        if (values.length === 0 || values.every((v) => !v || v.trim().length === 0)) {
            continue;
        }

        const row: Record<string, string> = {};

        // Map values to headers
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j].trim();
            const value = j < values.length ? values[j].trim() : "";
            row[header] = value;
        }

        results.push(row);
    }

    return results;
}

/**
 * Helper function to parse a CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = i + 1 < line.length ? line[i + 1] : null;

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === "," && !inQuotes) {
            // Field separator
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }

    // Add last field
    result.push(current);

    return result;
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Validation error type
 */
export class ValidationError extends Error {
    constructor(
        public field: string,
        public value: any,
        message: string
    ) {
        super(message);
        this.name = "ValidationError";
    }
}

/**
 * Validate student import data
 * 
 * @param data - Student data object from CSV
 * @returns Validation result with errors array
 */
export function validateStudentData(data: Record<string, string>): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Required fields
    const requiredFields = [
        "email",
        "firstName",
        "lastName",
        "studentNumber",
        "level",
        "status",
    ];

    for (const field of requiredFields) {
        if (!data[field] || data[field].trim().length === 0) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Validate email format
    if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email.trim())) {
            errors.push(`Invalid email format: ${data.email}`);
        }
    }

    // Validate student number (should be non-empty string)
    if (data.studentNumber && data.studentNumber.trim().length === 0) {
        errors.push("Student number cannot be empty");
    }

    // Validate level (should be a valid level like "100", "200", etc.)
    if (data.level) {
        const levelRegex = /^(100|200|300|400|500)$/;
        if (!levelRegex.test(data.level.trim())) {
            errors.push(`Invalid level: ${data.level}. Must be 100, 200, 300, 400, or 500`);
        }
    }

    // Validate status (should be one of: active, suspended, graduated, inactive)
    if (data.status) {
        const validStatuses = ["active", "suspended", "graduated", "inactive"];
        if (!validStatuses.includes(data.status.trim().toLowerCase())) {
            errors.push(`Invalid status: ${data.status}. Must be one of: ${validStatuses.join(", ")}`);
        }
    }

    // Validate academic standing if provided
    if (data.academicStanding) {
        const validStandings = [
            "First Class",
            "Second Class (Upper Division)",
            "Second Class (Lower Division)",
            "Third Class",
            "Probation",
        ];
        if (!validStandings.includes(data.academicStanding.trim())) {
            errors.push(
                `Invalid academic standing: ${data.academicStanding}. Must be one of: ${validStandings.join(", ")}`
            );
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate course import data
 * 
 * @param data - Course data object from CSV
 * @returns Validation result with errors array
 */
export function validateCourseData(data: Record<string, string>): {
    isValid: boolean;
    errors: string[];
} {
    const errors: string[] = [];

    // Required fields
    const requiredFields = ["code", "title", "description", "credits", "level"];

    for (const field of requiredFields) {
        if (!data[field] || data[field].trim().length === 0) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Validate course code (should be non-empty, typically alphanumeric)
    if (data.code) {
        if (data.code.trim().length === 0) {
            errors.push("Course code cannot be empty");
        }
    }

    // Validate credits (should be a positive number)
    if (data.credits) {
        const credits = parseFloat(data.credits);
        if (isNaN(credits) || credits <= 0) {
            errors.push(`Invalid credits: ${data.credits}. Must be a positive number`);
        }
    }

    // Validate level (should be a valid level like "100", "200", etc.)
    if (data.level) {
        const levelRegex = /^(100|200|300|400|500)$/;
        if (!levelRegex.test(data.level.trim())) {
            errors.push(`Invalid level: ${data.level}. Must be 100, 200, 300, 400, or 500`);
        }
    }

    // Validate status if provided (should be C, R, or E)
    if (data.status) {
        const validStatuses = ["C", "R", "E"];
        if (!validStatuses.includes(data.status.trim().toUpperCase())) {
            errors.push(`Invalid status: ${data.status}. Must be C (Core), R (Required), or E (Elective)`);
        }
    }

    // Validate prerequisites if provided (should be comma-separated course codes)
    if (data.prerequisites) {
        const prereqs = data.prerequisites.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
        // Just validate format, not existence of courses (that will be checked during import)
        for (const prereq of prereqs) {
            if (prereq.length === 0) {
                errors.push("Empty prerequisite course code found");
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

// ============================================================================
// Import Functions
// ============================================================================

/**
 * Bulk import students from CSV
 * 
 * @param db - Database writer
 * @param csvData - Parsed CSV data array
 * @param departmentId - Department ID to assign to students
 * @returns Import result with success count and errors
 */
export async function importStudentsFromCSV(
    db: DatabaseWriter,
    csvData: Record<string, string>[],
    departmentId: Id<"departments">
): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; errors: string[] }>;
}> {
    const errors: Array<{ row: number; errors: string[] }> = [];
    let successCount = 0;

    // Verify department exists
    const department = await db.get(departmentId);
    if (!department) {
        throw new Error(`Department not found: ${departmentId}`);
    }

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 2; // +2 because CSV has header and is 1-indexed

        // Validate data
        const validation = validateStudentData(row);
        if (!validation.isValid) {
            errors.push({ row: rowNumber, errors: validation.errors });
            continue;
        }

        try {
            // Check if user with this email already exists
            const existingUser = await db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", row.email.trim().toLowerCase()))
                .first();

            let userId: Id<"users">;

            if (existingUser) {
                // Check if student already exists for this user
                const existingStudent = await db
                    .query("students")
                    .withIndex("by_userId", (q) => q.eq("userId", existingUser._id))
                    .first();

                if (existingStudent) {
                    errors.push({
                        row: rowNumber,
                        errors: [`Student already exists for email: ${row.email}`],
                    });
                    continue;
                }

                userId = existingUser._id;
            } else {
                // Create new user
                // Note: In a real system, you'd hash the password properly
                // For now, we'll create a placeholder password that needs to be reset
                const defaultPassword = "TempPassword123!"; // Should be hashed
                userId = await db.insert("users", {
                    email: row.email.trim().toLowerCase(),
                    hashedPassword: defaultPassword, // Should be properly hashed
                    roles: ["student"],
                    profile: {
                        firstName: row.firstName.trim(),
                        middleName: row.middleName?.trim(),
                        lastName: row.lastName.trim(),
                    },
                    active: true,
                });
            }

            // Check if student number already exists
            const existingStudentByNumber = await db
                .query("students")
                .withIndex("by_studentNumber", (q) => q.eq("studentNumber", row.studentNumber.trim()))
                .first();

            if (existingStudentByNumber) {
                errors.push({
                    row: rowNumber,
                    errors: [`Student number already exists: ${row.studentNumber}`],
                });
                continue;
            }

            // Create student
            const admissionYear = row.admissionYear
                ? parseInt(row.admissionYear, 10)
                : new Date().getFullYear();

            if (isNaN(admissionYear)) {
                errors.push({
                    row: rowNumber,
                    errors: [`Invalid admission year: ${row.admissionYear}`],
                });
                continue;
            }

            await db.insert("students", {
                userId,
                studentNumber: row.studentNumber.trim(),
                admissionYear,
                departmentId,
                level: row.level.trim(),
                status: row.status.trim().toLowerCase(),
                academicStanding: row.academicStanding?.trim() || undefined,
            });

            successCount++;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            errors.push({
                row: rowNumber,
                errors: [errorMessage],
            });
        }
    }

    return {
        success: successCount,
        failed: errors.length,
        errors,
    };
}

/**
 * Bulk import courses from CSV
 * 
 * @param db - Database writer
 * @param csvData - Parsed CSV data array
 * @param departmentId - Department ID to assign to courses
 * @returns Import result with success count and errors
 */
export async function importCoursesFromCSV(
    db: DatabaseWriter,
    csvData: Record<string, string>[],
    departmentId: Id<"departments">
): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; errors: string[] }>;
}> {
    const errors: Array<{ row: number; errors: string[] }> = [];
    let successCount = 0;

    // Verify department exists
    const department = await db.get(departmentId);
    if (!department) {
        throw new Error(`Department not found: ${departmentId}`);
    }

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 2; // +2 because CSV has header and is 1-indexed

        // Validate data
        const validation = validateCourseData(row);
        if (!validation.isValid) {
            errors.push({ row: rowNumber, errors: validation.errors });
            continue;
        }

        try {
            // Check if course code already exists
            const existingCourse = await db
                .query("courses")
                .withIndex("by_code", (q) => q.eq("code", row.code.trim().toUpperCase()))
                .first();

            if (existingCourse) {
                errors.push({
                    row: rowNumber,
                    errors: [`Course code already exists: ${row.code}`],
                });
                continue;
            }

            // Parse prerequisites
            const prerequisites: string[] = [];
            if (row.prerequisites) {
                const prereqCodes = row.prerequisites
                    .split(",")
                    .map((p) => p.trim().toUpperCase())
                    .filter((p) => p.length > 0);
                prerequisites.push(...prereqCodes);
            }

            // Parse program IDs if provided
            const programIds: Id<"programs">[] = [];
            if (row.programIds) {
                const programIdStrings = row.programIds.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
                for (const programIdStr of programIdStrings) {
                    try {
                        const programId = programIdStr as Id<"programs">;
                        const program = await db.get(programId);
                        if (!program) {
                            errors.push({
                                row: rowNumber,
                                errors: [`Program not found: ${programIdStr}`],
                            });
                            continue;
                        }
                        programIds.push(programId);
                    } catch {
                        errors.push({
                            row: rowNumber,
                            errors: [`Invalid program ID format: ${programIdStr}`],
                        });
                        continue;
                    }
                }
            }

            // Parse credits
            const credits = parseFloat(row.credits);
            if (isNaN(credits) || credits <= 0) {
                errors.push({
                    row: rowNumber,
                    errors: [`Invalid credits: ${row.credits}`],
                });
                continue;
            }

            // Create course
            await db.insert("courses", {
                code: row.code.trim().toUpperCase(),
                title: row.title.trim(),
                description: row.description.trim(),
                credits,
                prerequisites,
                departmentId,
                programIds,
                status: (row.status?.trim().toUpperCase() || "E") as "C" | "R" | "E",
                level: row.level.trim(),
            });

            successCount++;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            errors.push({
                row: rowNumber,
                errors: [errorMessage],
            });
        }
    }

    return {
        success: successCount,
        failed: errors.length,
        errors,
    };
}

/**
 * Bulk import enrollments from CSV
 * 
 * @param db - Database writer
 * @param csvData - Parsed CSV data array
 * @param sectionId - Section ID to enroll students into
 * @returns Import result with success count and errors
 */
export async function importEnrollmentsFromCSV(
    db: DatabaseWriter,
    csvData: Record<string, string>[],
    sectionId: Id<"sections">
): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; errors: string[] }>;
}> {
    const errors: Array<{ row: number; errors: string[] }> = [];
    let successCount = 0;

    // Verify section exists
    const section = await db.get(sectionId);
    if (!section) {
        throw new Error(`Section not found: ${sectionId}`);
    }

    // Get term and session info from section
    const termId = section.termId;
    const sessionId = section.sessionId;

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 2; // +2 because CSV has header and is 1-indexed

        try {
            // Required field: studentNumber or studentId
            const studentIdentifier = row.studentNumber || row.studentId;
            if (!studentIdentifier || studentIdentifier.trim().length === 0) {
                errors.push({
                    row: rowNumber,
                    errors: ["Missing required field: studentNumber or studentId"],
                });
                continue;
            }

            // Find student by student number or ID
            let studentId: Id<"students"> | null = null;

            if (row.studentId) {
                try {
                    const student = await db.get(row.studentId as Id<"students">);
                    if (student) {
                        studentId = student._id;
                    }
                } catch {
                    // Invalid ID format, try student number instead
                }
            }

            if (!studentId && row.studentNumber) {
                const student = await db
                    .query("students")
                    .withIndex("by_studentNumber", (q) => q.eq("studentNumber", row.studentNumber.trim()))
                    .first();
                if (student) {
                    studentId = student._id;
                }
            }

            if (!studentId) {
                errors.push({
                    row: rowNumber,
                    errors: [`Student not found: ${studentIdentifier}`],
                });
                continue;
            }

            // Check if enrollment already exists
            const existingEnrollment = await db
                .query("enrollments")
                .withIndex("by_studentId_sectionId", (q) =>
                    q.eq("studentId", studentId!).eq("sectionId", sectionId)
                )
                .first();

            if (existingEnrollment) {
                errors.push({
                    row: rowNumber,
                    errors: [`Student already enrolled in this section`],
                });
                continue;
            }

            // Check section capacity
            if (section.enrollmentCount >= section.capacity) {
                errors.push({
                    row: rowNumber,
                    errors: [`Section is at full capacity`],
                });
                continue;
            }

            // Create enrollment
            const enrollmentId = await db.insert("enrollments", {
                studentId,
                sectionId,
                sessionId,
                termId,
                status: row.status?.trim().toLowerCase() || "enrolled",
                enrolledAt: Date.now(),
                grade: row.grade?.trim() || undefined,
                term: row.term?.trim() || undefined,
            });

            // Update section enrollment count
            await db.patch(sectionId, {
                enrollmentCount: section.enrollmentCount + 1,
            });

            successCount++;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            errors.push({
                row: rowNumber,
                errors: [errorMessage],
            });
        }
    }

    return {
        success: successCount,
        failed: errors.length,
        errors,
    };
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Convert object to CSV row
 */
function objectToCSVRow(obj: Record<string, any>): string {
    const values = Object.values(obj).map((value) => {
        const str = String(value ?? "");
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    });
    return values.join(",");
}

/**
 * Export students to CSV
 * 
 * @param db - Database reader
 * @param filters - Optional filters for students
 * @returns CSV string
 */
export async function exportStudentsToCSV(
    db: DatabaseReader,
    filters?: {
        departmentId?: Id<"departments">;
        status?: string;
        level?: string;
    }
): Promise<string> {
    let students = await db.query("students").collect();

    // Apply filters
    if (filters?.departmentId) {
        students = students.filter((s) => s.departmentId === filters.departmentId);
    }
    if (filters?.status) {
        students = students.filter((s) => s.status === filters.status);
    }
    if (filters?.level) {
        students = students.filter((s) => s.level === filters.level);
    }

    // Fetch user data for each student
    const studentsWithDetails = await Promise.all(
        students.map(async (student) => {
            const user = await db.get(student.userId);
            return {
                studentId: student._id,
                studentNumber: student.studentNumber,
                email: user?.email || "",
                firstName: user?.profile.firstName || "",
                middleName: user?.profile.middleName || "",
                lastName: user?.profile.lastName || "",
                admissionYear: student.admissionYear,
                level: student.level,
                status: student.status,
                academicStanding: student.academicStanding || "",
                departmentId: student.departmentId,
            };
        })
    );

    // Generate CSV
    const headers = [
        "studentId",
        "studentNumber",
        "email",
        "firstName",
        "middleName",
        "lastName",
        "admissionYear",
        "level",
        "status",
        "academicStanding",
        "departmentId",
    ];

    const rows = [headers.join(",")];
    for (const student of studentsWithDetails) {
        rows.push(objectToCSVRow(student));
    }

    return rows.join("\n");
}

/**
 * Export courses to CSV
 * 
 * @param db - Database reader
 * @param filters - Optional filters for courses
 * @returns CSV string
 */
export async function exportCoursesToCSV(
    db: DatabaseReader,
    filters?: {
        departmentId?: Id<"departments">;
        level?: string;
        status?: string;
    }
): Promise<string> {
    let courses = await db.query("courses").collect();

    // Apply filters
    if (filters?.departmentId) {
        courses = courses.filter((c) => c.departmentId === filters.departmentId);
    }
    if (filters?.level) {
        courses = courses.filter((c) => c.level === filters.level);
    }
    if (filters?.status) {
        courses = courses.filter((c) => c.status === filters.status);
    }

    // Generate CSV
    const headers = [
        "courseId",
        "code",
        "title",
        "description",
        "credits",
        "prerequisites",
        "departmentId",
        "programIds",
        "status",
        "level",
    ];

    const rows = [headers.join(",")];
    for (const course of courses) {
        rows.push(
            objectToCSVRow({
                courseId: course._id,
                code: course.code,
                title: course.title,
                description: course.description,
                credits: course.credits,
                prerequisites: course.prerequisites.join(","),
                departmentId: course.departmentId,
                programIds: course.programIds.join(","),
                status: course.status,
                level: course.level,
            })
        );
    }

    return rows.join("\n");
}

/**
 * Export enrollments to CSV
 * 
 * @param db - Database reader
 * @param sectionId - Section ID to export enrollments for
 * @returns CSV string
 */
export async function exportEnrollmentsToCSV(
    db: DatabaseReader,
    sectionId: Id<"sections">
): Promise<string> {
    // Get all enrollments for the section
    const enrollments = await db
        .query("enrollments")
        .withIndex("by_sectionId", (q) => q.eq("sectionId", sectionId))
        .collect();

    // Fetch student and section details
    const enrollmentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
            const student = await db.get(enrollment.studentId);
            const section = await db.get(enrollment.sectionId);
            const course = section ? await db.get(section.courseId) : null;

            return {
                enrollmentId: enrollment._id,
                studentId: enrollment.studentId,
                studentNumber: student?.studentNumber || "",
                sectionId: enrollment.sectionId,
                courseCode: course?.code || "",
                courseTitle: course?.title || "",
                status: enrollment.status,
                enrolledAt: new Date(enrollment.enrolledAt).toISOString(),
                grade: enrollment.grade || "",
                term: enrollment.term || "",
                termId: enrollment.termId,
                sessionId: enrollment.sessionId,
            };
        })
    );

    // Generate CSV
    const headers = [
        "enrollmentId",
        "studentId",
        "studentNumber",
        "sectionId",
        "courseCode",
        "courseTitle",
        "status",
        "enrolledAt",
        "grade",
        "term",
        "termId",
        "sessionId",
    ];

    const rows = [headers.join(",")];
    for (const enrollment of enrollmentsWithDetails) {
        rows.push(objectToCSVRow(enrollment));
    }

    return rows.join("\n");
}

