/**
 * Enrollment Mutations
 * 
 * Transactional operations for student enrollment.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import {
  validateStudentCanEnroll,
  validateSectionCanEnroll,
  NotFoundError,
} from "../lib/aggregates";
import {
  validateEnrollmentDomainChecks,
} from "../lib/services/enrollmentService";
import { logStudentEnrolled, logStudentDropped } from "../lib/services/auditLogService";
import { validateSessionToken } from "../lib/session";

/**
 * Operation: Enroll Student in a Section
 * 
 * This is a transactional operation that:
 * 1. Validates student can enroll (status check)
 * 2. Validates section has capacity
 * 3. Performs domain checks (prerequisites, schedule conflicts)
 * 4. Creates enrollment
 * 5. Updates section enrollment count
 * 6. Creates audit log
 * 
 * All steps are atomic - if any step fails, the entire transaction is rolled back.
 */
export const enrollStudentInSection = mutation({
  args: {
    studentId: v.id("students"),
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    // Step 1: Read and validate student aggregate
    // Invariant Check: Student status must be "active"
    await validateStudentCanEnroll(ctx.db, args.studentId);

    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new NotFoundError("Student", args.studentId);
    }

    // Step 2: Read and validate section aggregate
    // Invariant Check: enrollmentCount must be less than capacity
    await validateSectionCanEnroll(ctx.db, args.sectionId);

    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new NotFoundError("Section", args.sectionId);
    }

    // Step 3: Domain checks (prerequisites, schedule conflicts)
    await validateEnrollmentDomainChecks(ctx.db, args.studentId, args.sectionId);

    // Step 4: Create enrollment document
    const enrollmentId = await ctx.db.insert("enrollments", {
      studentId: args.studentId,
      sectionId: args.sectionId,
      sessionId: section.sessionId,
      termId: section.termId,
      status: "enrolled",
      enrolledAt: Date.now(),
    });

    // Step 5: Increment section enrollment count
    await ctx.db.patch(args.sectionId, {
      enrollmentCount: section.enrollmentCount + 1,
    });

    // Step 6: Create audit log entry
    // Note: We need a userId for audit log - using student.userId as the actor
    // In a real system, you might get this from authentication context
    await logStudentEnrolled(
      ctx.db,
      student.userId,
      enrollmentId,
      {
        studentId: args.studentId,
        sectionId: args.sectionId,
        courseId: section.courseId,
        termId: section.termId,
      }
    );

    return {
      success: true,
      enrollmentId,
      enrollmentCount: section.enrollmentCount + 1,
    };
  },
});

/**
 * Enroll current student in a section
 * 
 * Simplified enrollment mutation that:
 * 1. Gets student from authenticated user (via token)
 * 2. Atomically checks if section has capacity
 * 3. Prevents duplicate enrollment in same course/term
 * 4. Creates enrollment with status 'active'
 * 5. Increments section enrollment count
 * 
 * Input: sectionId (and optional token for authentication)
 */
export const enroll = mutation({
  args: {
    sectionId: v.id("sections"),
    token: v.optional(v.string()), // Session token for authentication
  },
  handler: async (ctx, args) => {
    // Step 1: Authenticate and get student
    if (!args.token) {
      throw new Error("Authentication required");
    }

    const userId = await validateSessionToken(ctx.db, args.token);
    if (!userId) {
      throw new Error("Invalid session token");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify user is a student
    if (!user.roles.includes("student")) {
      throw new Error("Only students can enroll in sections");
    }

    // Get student record
    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!student) {
      throw new Error("Student record not found");
    }

    // Step 2: Get and validate section
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new NotFoundError("Section", args.sectionId);
    }

    // Atomic check: if section is full, throw error
    if (section.enrollmentCount >= section.capacity) {
      throw new Error("Section Full");
    }

    // Step 3: Check if student is already enrolled in any section of this course for the same term
    const existingEnrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    // Check for duplicate enrollment in same course and term
    for (const enrollment of existingEnrollments) {
      const enrolledSection = await ctx.db.get(enrollment.sectionId);
      if (
        enrolledSection &&
        enrolledSection.courseId === section.courseId &&
        enrolledSection.termId === section.termId &&
        (enrollment.status === "active" || enrollment.status === "enrolled" || enrollment.status === "waitlisted")
      ) {
        throw new Error("You have already enrolled for this course.");
      }
    }

    // Step 4: Get term name for enrollment record
    const term = await ctx.db.get(section.termId);
    const termName = term ? term.name : undefined;

    // Step 5: Create enrollment document
    const enrollmentId = await ctx.db.insert("enrollments", {
      studentId: student._id,
      sectionId: args.sectionId,
      sessionId: section.sessionId,
      termId: section.termId,
      status: "active",
      enrolledAt: Date.now(),
      term: termName,
    });

    // Step 6: Increment section enrollment count
    await ctx.db.patch(args.sectionId, {
      enrollmentCount: section.enrollmentCount + 1,
    });

    return {
      success: true,
      enrollmentId,
      enrollmentCount: section.enrollmentCount + 1,
    };
  },
});

/**
 * Drop enrollment (withdrawal)
 * 
 * Transactional operation to drop a student from a section.
 */
export const dropEnrollment = mutation({
  args: {
    enrollmentId: v.id("enrollments"),
    userId: v.id("users"), // User performing the action (student or admin)
  },
  handler: async (ctx, args) => {
    const enrollment = await ctx.db.get(args.enrollmentId);
    if (!enrollment) {
      throw new NotFoundError("Enrollment", args.enrollmentId);
    }

    // Check if enrollment can be dropped (not already dropped/completed)
    if (enrollment.status === "dropped" || enrollment.status === "completed") {
      throw new Error(`Cannot drop enrollment with status: ${enrollment.status}`);
    }

    const section = await ctx.db.get(enrollment.sectionId);
    if (!section) {
      throw new NotFoundError("Section", enrollment.sectionId);
    }

    // Update enrollment status
    await ctx.db.patch(args.enrollmentId, {
      status: "dropped",
    });

    // Decrement section enrollment count
    await ctx.db.patch(enrollment.sectionId, {
      enrollmentCount: Math.max(0, section.enrollmentCount - 1),
    });

    // Create audit log
    await logStudentDropped(
      ctx.db,
      args.userId,
      args.enrollmentId,
      {
        studentId: enrollment.studentId,
        sectionId: enrollment.sectionId,
      }
    );

    return { success: true };
  },
});

