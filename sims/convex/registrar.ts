/**
 * Registrar Queries and Mutations
 * 
 * Provides queries and mutations for registrar grade management.
 * Accessible only to users with role === 'registrar'.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateSessionToken } from "./lib/session";
import { Id } from "./_generated/dataModel";

/**
 * Get all sections with aggregated status for registrar grade dashboard
 * Input: term (string) - term name to filter by
 * Returns: List of all sections with aggregated status and % of students graded
 */
export const getAllSectionsStatus = query({
  args: {
    token: v.optional(v.string()),
    term: v.optional(v.string()), // Term name as string
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    // Validate session token and get user
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

    // Verify role is registrar
    if (!user.roles.includes("registrar")) {
      throw new Error("Access denied: Registrar role required");
    }

    // Get all sections
    let sections = await ctx.db.query("sections").collect();

    // Filter by term if provided
    if (args.term) {
      // Find term by name
      const terms = await ctx.db.query("terms").collect();
      const matchingTerm = terms.find((t) => t.name === args.term);
      if (matchingTerm) {
        sections = sections.filter((section) => section.termId === matchingTerm._id);
      } else {
        // If term not found, return empty array
        return [];
      }
    }

    // Filter by department if provided
    if (args.departmentId) {
      // Get all courses in this department
      const departmentId = args.departmentId; // TypeScript narrowing
      const departmentCourses = await ctx.db
        .query("courses")
        .withIndex("by_departmentId", (q) => q.eq("departmentId", departmentId))
        .collect();
      
      const courseIds = departmentCourses.map((c) => c._id);
      sections = sections.filter((section) => courseIds.includes(section.courseId));
    }

    // Enrich sections with course, instructor, and grade status information
    const sectionsWithStatus = await Promise.all(
      sections.map(async (section) => {
        // Get course information
        const course = await ctx.db.get(section.courseId);
        if (!course) {
          return null;
        }

        // Get department information
        const department = await ctx.db.get(course.departmentId);
        
        // Get instructor information
        const instructor = section.instructorId
          ? await ctx.db.get(section.instructorId)
          : null;
        
        const instructorName = instructor
          ? `${instructor.profile.firstName} ${instructor.profile.lastName}`
          : "Unassigned";

        // Get term information
        const term = await ctx.db.get(section.termId);
        const termName = term?.name || "Unknown";

        // Get all enrollments for this section
        const enrollments = await ctx.db
          .query("enrollments")
          .withIndex("by_sectionId", (q) => q.eq("sectionId", section._id))
          .filter((q) =>
            q.or(
              q.eq(q.field("status"), "enrolled"),
              q.eq(q.field("status"), "active")
            )
          )
          .collect();

        const totalStudents = enrollments.length;

        // Count students with final grades (enrollment.grade is set)
        const studentsWithGrades = enrollments.filter((e) => e.grade !== undefined && e.grade !== null).length;

        // Calculate percentage of students graded
        const percentageGraded = totalStudents > 0
          ? Math.round((studentsWithGrades / totalStudents) * 100)
          : 0;

        // Determine grade status
        let gradeStatus: "Grades Submitted" | "Pending" | "Locked";
        if (section.finalGradesPosted && section.gradesEditable === false) {
          gradeStatus = "Locked";
        } else if (section.finalGradesPosted) {
          gradeStatus = "Grades Submitted";
        } else {
          gradeStatus = "Pending";
        }

        return {
          _id: section._id,
          courseCode: course.code,
          courseTitle: course.title,
          departmentId: course.departmentId,
          departmentName: department?.name || "Unknown",
          instructorId: section.instructorId,
          instructorName,
          termId: section.termId,
          termName,
          totalStudents,
          studentsWithGrades,
          percentageGraded,
          gradeStatus,
          finalGradesPosted: section.finalGradesPosted ?? false,
          gradesEditable: section.gradesEditable ?? true,
        };
      })
    );

    // Filter out null entries
    return sectionsWithStatus.filter((s) => s !== null) as Array<{
      _id: Id<"sections">;
      courseCode: string;
      courseTitle: string;
      departmentId: Id<"departments">;
      departmentName: string;
      instructorId: Id<"users"> | null;
      instructorName: string;
      termId: Id<"terms">;
      termName: string;
      totalStudents: number;
      studentsWithGrades: number;
      percentageGraded: number;
      gradeStatus: "Grades Submitted" | "Pending" | "Locked";
      finalGradesPosted: boolean;
      gradesEditable: boolean;
    }>;
  },
});

/**
 * Send reminder notification to instructor
 * Input: instructorId
 * Logic: Triggers a notification "Please submit grades for [Section]"
 */
export const sendReminder = mutation({
  args: {
    token: v.optional(v.string()),
    instructorId: v.id("users"),
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    // Validate session token and get user
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

    // Verify role is registrar
    if (!user.roles.includes("registrar")) {
      throw new Error("Access denied: Registrar role required");
    }

    // Verify instructor exists
    const instructor = await ctx.db.get(args.instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    // Get section information
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new Error("Section not found");
    }

    // Verify instructor is assigned to this section
    if (section.instructorId !== args.instructorId) {
      throw new Error("Instructor is not assigned to this section");
    }

    // Get course information for the notification message
    const course = await ctx.db.get(section.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Create notification for the instructor
    await ctx.db.insert("notifications", {
      userId: args.instructorId,
      message: `Please submit grades for ${course.code} - ${course.title}`,
      read: false,
      createdAt: Date.now(),
      courseId: course._id,
    });

    return { success: true };
  },
});

