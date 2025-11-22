import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Core Entity Collections and Value Objects Schema
 * 
 * This schema defines all primary collections for the Student Information Management System (SIMS)
 * along with embedded value objects used within them.
 */

export default defineSchema({
  // ============================================================================
  // CORE ENTITY COLLECTIONS
  // ============================================================================

  /**
   * Schools Collection
   * Represents educational institutions
   */
  schools: defineTable({
    name: v.string(),
    address: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),
    contact: v.object({
      email: v.string(),
      phone: v.string(),
    }),
  }),

  /**
   * Departments Collection
   * Represents academic departments within schools
   */
  departments: defineTable({
    schoolId: v.id("schools"),
    name: v.string(),
    headId: v.id("users"),
  }),

  /**
   * Programs Collection
   * Represents academic programs offered by departments
   */
  programs: defineTable({
    departmentId: v.id("departments"),
    code: v.string(),
    name: v.string(),
    requirements: v.any(), // Flexible object for varying program requirements
  }),

  /**
   * Courses Collection
   * Represents individual courses that can be offered
   */
  courses: defineTable({
    code: v.string(),
    title: v.string(),
    description: v.string(),
    credits: v.number(),
    prerequisites: v.array(v.id("courses")),
  }),

  /**
   * Sections Collection
   * Represents specific course offerings in a term
   * Uses AcademicPeriod value object to contextualize the section
   */
  sections: defineTable({
    courseId: v.id("courses"),
    sessionId: v.id("academicSessions"), // AcademicPeriod: sessionId
    termId: v.id("terms"), // AcademicPeriod: termId
    instructorId: v.id("users"),
    capacity: v.number(),
    scheduleSlots: v.array(
      v.object({
        // ScheduleSlotSpec value object
        day: v.string(), // e.g., "Mon", "Tue", "Wed", etc.
        startTime: v.string(),
        endTime: v.string(),
        room: v.string(),
      })
    ),
    enrollmentCount: v.number(),
  }),

  /**
   * Users Collection
   * Represents all system users (students, instructors, admins, etc.)
   */
  users: defineTable({
    username: v.string(),
    hashedPassword: v.string(),
    roles: v.array(v.string()),
    profile: v.object({
      firstName: v.string(),
      middleName: v.optional(v.string()),
      lastName: v.string(),
    }),
  }),

  /**
   * Students Collection
   * Represents student-specific information linked to users
   * Uses StudentIdentifier value object
   */
  students: defineTable({
    userId: v.id("users"),
    studentNumber: v.string(), // StudentIdentifier: studentNumber
    admissionYear: v.number(), // StudentIdentifier: admissionYear
    programId: v.id("programs"),
    level: v.string(),
    status: v.string(),
  }),

  /**
   * Enrollments Collection
   * Represents student enrollments in course sections
   * Uses AcademicPeriod value object to contextualize the enrollment
   */
  enrollments: defineTable({
    studentId: v.id("students"),
    sectionId: v.id("sections"),
    sessionId: v.id("academicSessions"), // AcademicPeriod: sessionId
    termId: v.id("terms"), // AcademicPeriod: termId
    status: v.string(),
    enrolledAt: v.number(), // Unix timestamp
  }),

  /**
   * Assessments Collection
   * Represents assessments (exams, assignments, etc.) for sections
   */
  assessments: defineTable({
    sectionId: v.id("sections"),
    title: v.string(),
    weight: v.number(),
    maxScore: v.number(),
  }),

  /**
   * Grades Collection
   * Represents individual grades for assessments
   * Uses GradeValue value object
   */
  grades: defineTable({
    enrollmentId: v.id("enrollments"),
    assessmentId: v.id("assessments"),
    grade: v.object({
      // GradeValue value object
      numeric: v.number(),
      letter: v.string(),
      points: v.number(),
    }),
    recordedBy: v.id("users"),
  }),

  /**
   * Transcripts Collection
   * Represents student academic transcripts
   */
  transcripts: defineTable({
    studentId: v.id("students"),
    entries: v.array(
      v.object({
        // Transcript entry structure
        courseCode: v.string(),
        courseTitle: v.string(),
        credits: v.number(),
        grade: v.object({
          numeric: v.number(),
          letter: v.string(),
          points: v.number(),
        }),
        term: v.string(),
        year: v.number(),
      })
    ),
    gpa: v.number(),
    metadata: v.optional(
      v.object({
        generatedBy: v.id("users"),
        generatedAt: v.number(), // Unix timestamp
        format: v.string(),
      })
    ),
  }),

  /**
   * Academic Sessions Collection
   * Represents academic sessions and their terms
   * Note: Terms are also stored in a separate 'terms' collection for proper id references
   */
  academicSessions: defineTable({
    label: v.string(),
    terms: v.array(
      v.object({
        id: v.string(), // Term identifier within the session
        name: v.string(),
        startDate: v.number(), // Unix timestamp
        endDate: v.number(), // Unix timestamp
      })
    ),
  }),

  /**
   * Terms Collection
   * Represents individual terms within academic sessions
   * This collection enables proper id references for sections and enrollments
   */
  terms: defineTable({
    sessionId: v.id("academicSessions"),
    name: v.string(),
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
  }),

  /**
   * Graduation Records Collection
   * Represents graduation approvals and records
   */
  graduationRecords: defineTable({
    studentId: v.id("students"),
    approvedBy: v.id("users"),
    date: v.number(), // Unix timestamp
  }),

  /**
   * Audit Logs Collection
   * Represents system audit trail for tracking changes
   */
  auditLogs: defineTable({
    entity: v.string(),
    action: v.string(),
    userId: v.id("users"),
    timestamp: v.number(), // Unix timestamp
    details: v.any(), // Flexible object for varying audit details
  }),
});

