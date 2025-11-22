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
  })
    .index("by_name", ["name"]),

  /**
   * Departments Collection
   * Represents academic departments within schools
   * Foreign Keys: schoolId → schools._id, headId → users._id
   */
  departments: defineTable({
    schoolId: v.id("schools"),
    name: v.string(),
    headId: v.id("users"),
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_headId", ["headId"])
    .index("by_name", ["name"]),

  /**
   * Programs Collection
   * Represents academic programs offered by departments
   * Foreign Keys: departmentId → departments._id
   */
  programs: defineTable({
    departmentId: v.id("departments"),
    code: v.string(),
    name: v.string(),
    requirements: v.any(), // Flexible object for varying program requirements
  })
    .index("by_departmentId", ["departmentId"])
    .index("by_code", ["code"]),

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
  })
    .index("by_code", ["code"]),

  /**
   * Sections Collection
   * Represents specific course offerings in a term
   * Uses AcademicPeriod value object to contextualize the section
   * Foreign Keys: courseId → courses._id, termId → terms._id, instructorId → users._id
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
  })
    .index("by_courseId", ["courseId"])
    .index("by_termId", ["termId"])
    .index("by_sessionId", ["sessionId"])
    .index("by_instructorId", ["instructorId"])
    .index("by_courseId_termId", ["courseId", "termId"]),

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
  })
    .index("by_username", ["username"]),

  /**
   * Students Collection
   * Represents student-specific information linked to users
   * Uses StudentIdentifier value object
   * Foreign Keys: userId → users._id, programId → programs._id
   */
  students: defineTable({
    userId: v.id("users"),
    studentNumber: v.string(), // StudentIdentifier: studentNumber
    admissionYear: v.number(), // StudentIdentifier: admissionYear
    programId: v.id("programs"),
    level: v.string(),
    status: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_studentNumber", ["studentNumber"])
    .index("by_programId", ["programId"])
    .index("by_status", ["status"]),

  /**
   * Enrollments Collection
   * Represents student enrollments in course sections
   * Uses AcademicPeriod value object to contextualize the enrollment
   * Foreign Keys: studentId → students._id, sectionId → sections._id
   */
  enrollments: defineTable({
    studentId: v.id("students"),
    sectionId: v.id("sections"),
    sessionId: v.id("academicSessions"), // AcademicPeriod: sessionId
    termId: v.id("terms"), // AcademicPeriod: termId
    status: v.string(),
    enrolledAt: v.number(), // Unix timestamp
  })
    .index("by_studentId", ["studentId"])
    .index("by_sectionId", ["sectionId"])
    .index("by_studentId_sectionId", ["studentId", "sectionId"])
    .index("by_status", ["status"])
    .index("by_termId", ["termId"]),

  /**
   * Assessments Collection
   * Represents assessments (exams, assignments, etc.) for sections
   * Foreign Keys: sectionId → sections._id
   */
  assessments: defineTable({
    sectionId: v.id("sections"),
    title: v.string(),
    weight: v.number(),
    maxScore: v.number(),
  })
    .index("by_sectionId", ["sectionId"]),

  /**
   * Grades Collection
   * Represents individual grades for assessments
   * Uses GradeValue value object
   * Foreign Keys: enrollmentId → enrollments._id, assessmentId → assessments._id, recordedBy → users._id
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
  })
    .index("by_enrollmentId", ["enrollmentId"])
    .index("by_assessmentId", ["assessmentId"])
    .index("by_recordedBy", ["recordedBy"])
    .index("by_enrollmentId_assessmentId", ["enrollmentId", "assessmentId"]),

  /**
   * Transcripts Collection
   * Represents student academic transcripts
   * Foreign Keys: studentId → students._id
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
  })
    .index("by_studentId", ["studentId"]),

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
  })
    .index("by_label", ["label"]),

  /**
   * Terms Collection
   * Represents individual terms within academic sessions
   * This collection enables proper id references for sections and enrollments
   * Foreign Keys: sessionId → academicSessions._id
   */
  terms: defineTable({
    sessionId: v.id("academicSessions"),
    name: v.string(),
    startDate: v.number(), // Unix timestamp
    endDate: v.number(), // Unix timestamp
  })
    .index("by_sessionId", ["sessionId"]),

  /**
   * Graduation Records Collection
   * Represents graduation approvals and records
   * Foreign Keys: studentId → students._id, approvedBy → users._id
   */
  graduationRecords: defineTable({
    studentId: v.id("students"),
    approvedBy: v.id("users"),
    date: v.number(), // Unix timestamp
  })
    .index("by_studentId", ["studentId"])
    .index("by_approvedBy", ["approvedBy"])
    .index("by_date", ["date"]),

  /**
   * Audit Logs Collection
   * Represents system audit trail for tracking changes
   * Foreign Keys: userId → users._id
   */
  auditLogs: defineTable({
    entity: v.string(),
    action: v.string(),
    userId: v.id("users"),
    timestamp: v.number(), // Unix timestamp
    details: v.any(), // Flexible object for varying audit details
  })
    .index("by_userId", ["userId"])
    .index("by_entity", ["entity"])
    .index("by_timestamp", ["timestamp"])
    .index("by_entity_action", ["entity", "action"]),
});

