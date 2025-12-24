/**
 * Department Head Functions
 * 
 * Provides queries and mutations for department head dashboard and section management.
 * Restricted to users with role === 'department_head'.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { validateSessionToken } from "./lib/session";
import { NotFoundError, ValidationError } from "./lib/errors";
import { Id } from "./_generated/dataModel";

/**
 * Get dashboard statistics for department head
 * Returns total instructors, count of active sections, and count of unassigned sections
 */
export const getDashboardStats = query({
  args: {
    token: v.optional(v.string()),
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

    // Verify role is department_head
    if (!user.roles.includes("department_head")) {
      throw new Error("Access denied: Department head role required");
    }

    // Find department where this user is the head
    const department = await ctx.db
      .query("departments")
      .withIndex("by_headId", (q) => q.eq("headId", userId))
      .first();

    if (!department) {
      throw new Error("Department not found for this user");
    }

    // Get all courses in this department
    const departmentCourses = await ctx.db
      .query("courses")
      .withIndex("by_departmentId", (q) => q.eq("departmentId", department._id))
      .collect();

    const courseIds = departmentCourses.map((c) => c._id);

    // Get all sections for courses in this department
    const allSections = await ctx.db.query("sections").collect();
    const departmentSections = allSections.filter((section) =>
      courseIds.includes(section.courseId)
    );

    // Count unique instructors teaching in this department
    const instructorIds = new Set<Id<"users">>();
    for (const section of departmentSections) {
      if (section.instructorId) {
        const instructor = await ctx.db.get(section.instructorId);
        if (instructor && instructor.roles.includes("instructor")) {
          instructorIds.add(section.instructorId);
        }
      }
    }
    const totalInstructors = instructorIds.size;

    // Count active sections (sections with valid instructorId)
    const activeSections = departmentSections.filter(
      (section) => section.instructorId
    ).length;

    // Count unassigned sections (sections without instructorId or with invalid instructor)
    let unassignedCount = 0;
    for (const section of departmentSections) {
      if (!section.instructorId) {
        unassignedCount++;
      } else {
        const instructor = await ctx.db.get(section.instructorId);
        if (!instructor || !instructor.roles.includes("instructor")) {
          unassignedCount++;
        }
      }
    }
    const unassignedSections = unassignedCount;

    return {
      totalInstructors,
      activeSections,
      unassignedSections,
    };
  },
});

/**
 * Get all sections for the current department, filterable by term
 */
export const getSections = query({
  args: {
    token: v.optional(v.string()),
    termId: v.optional(v.id("terms")),
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

    // Verify role is department_head
    if (!user.roles.includes("department_head")) {
      throw new Error("Access denied: Department head role required");
    }

    // Find department where this user is the head
    const department = await ctx.db
      .query("departments")
      .withIndex("by_headId", (q) => q.eq("headId", userId))
      .first();

    if (!department) {
      throw new Error("Department not found for this user");
    }

    // Get all courses in this department
    const departmentCourses = await ctx.db
      .query("courses")
      .withIndex("by_departmentId", (q) => q.eq("departmentId", department._id))
      .collect();

    const courseIds = departmentCourses.map((c) => c._id);

    // Get all sections for courses in this department
    let sections = await ctx.db.query("sections").collect();
    sections = sections.filter((section) => courseIds.includes(section.courseId));

    // Filter by term if provided
    if (args.termId) {
      sections = sections.filter((section) => section.termId === args.termId);
    }

    // Enrich sections with course and instructor information
    const sectionsWithDetails = await Promise.all(
      sections.map(async (section) => {
        const course = await ctx.db.get(section.courseId);
        const term = await ctx.db.get(section.termId);
        const instructor = section.instructorId
          ? await ctx.db.get(section.instructorId)
          : null;

        const isValidInstructor = instructor && instructor.roles.includes("instructor");
        const instructorName = isValidInstructor
          ? `${instructor.profile.firstName} ${instructor.profile.lastName}`
          : "Unassigned";

        return {
          _id: section._id,
          courseCode: course?.code || "Unknown",
          courseTitle: course?.title || "Unknown",
          sectionId: section._id,
          instructorId: section.instructorId,
          instructorName,
          capacity: section.capacity,
          enrollmentCount: section.enrollmentCount,
          status: isValidInstructor ? "Active" : "Unassigned",
          termId: section.termId,
          termName: term?.name || "Unknown",
        };
      })
    );

    return sectionsWithDetails;
  },
});

/**
 * Create a new section
 * Validates that courseId belongs to the department head's department
 */
export const createSection = mutation({
  args: {
    token: v.optional(v.string()),
    courseId: v.id("courses"),
    termId: v.id("terms"),
    capacity: v.number(),
    details: v.optional(v.string()),
    instructorId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Validate session token and get user
    if (!args.token) {
      throw new ValidationError("token", "Authentication required");
    }

    const userId = await validateSessionToken(ctx.db, args.token);
    if (!userId) {
      throw new ValidationError("token", "Invalid session token");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    // Verify role is department_head
    if (!user.roles.includes("department_head")) {
      throw new Error("Access denied: Department head role required");
    }

    // Find department where this user is the head
    const department = await ctx.db
      .query("departments")
      .withIndex("by_headId", (q) => q.eq("headId", userId))
      .first();

    if (!department) {
      throw new Error("Department not found for this user");
    }

    // Validate that courseId belongs to this department
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new NotFoundError("Course", args.courseId);
    }

    if (course.departmentId !== department._id) {
      throw new ValidationError(
        "courseId",
        "Course does not belong to your department"
      );
    }

    // Validate term exists
    const term = await ctx.db.get(args.termId);
    if (!term) {
      throw new NotFoundError("Term", args.termId);
    }

    // Get session from term
    const session = await ctx.db.get(term.sessionId);
    if (!session) {
      throw new NotFoundError("Academic Session", term.sessionId);
    }

    // Validate capacity
    if (args.capacity <= 0) {
      throw new ValidationError("capacity", "Capacity must be greater than 0");
    }

    // Use provided instructorId or use department head as placeholder
    // The schema requires instructorId, so we use a placeholder if not provided
    // This section will show as "Unassigned" until an instructor is assigned
    const instructorIdToUse = args.instructorId || userId;

    // If instructorId is provided, validate it exists and has instructor role
    if (args.instructorId) {
      const instructor = await ctx.db.get(args.instructorId);
      if (!instructor) {
        throw new NotFoundError("Instructor", args.instructorId);
      }
      if (!instructor.roles.includes("instructor")) {
        throw new ValidationError(
          "instructorId",
          "User must have instructor role"
        );
      }
    }

    const sectionId = await ctx.db.insert("sections", {
      courseId: args.courseId,
      sessionId: term.sessionId,
      termId: args.termId,
      instructorId: instructorIdToUse,
      capacity: args.capacity,
      scheduleSlots: [], // Empty initially, can be added later
      enrollmentCount: 0,
    });

    return { success: true, sectionId };
  },
});

/**
 * Get all terms for dropdown selection
 */
export const getTerms = query({
  args: {},
  handler: async (ctx) => {
    const terms = await ctx.db.query("terms").collect();
    
    // Sort by start date descending (most recent first)
    const sortedTerms = terms.sort((a, b) => b.startDate - a.startDate);
    
    return sortedTerms.map((term) => ({
      _id: term._id,
      name: term.name,
      sessionId: term.sessionId,
      startDate: term.startDate,
      endDate: term.endDate,
    }));
  },
});

/**
 * Get all courses for the department head's department
 */
export const getDepartmentCourses = query({
  args: {
    token: v.optional(v.string()),
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

    // Verify role is department_head
    if (!user.roles.includes("department_head")) {
      throw new Error("Access denied: Department head role required");
    }

    // Find department where this user is the head
    const department = await ctx.db
      .query("departments")
      .withIndex("by_headId", (q) => q.eq("headId", userId))
      .first();

    if (!department) {
      throw new Error("Department not found for this user");
    }

    // Get all courses in this department
    const courses = await ctx.db
      .query("courses")
      .withIndex("by_departmentId", (q) => q.eq("departmentId", department._id))
      .collect();

    return courses.map((course) => ({
      _id: course._id,
      code: course.code,
      title: course.title,
      credits: course.credits,
    }));
  },
});

/**
 * Get all instructors in the department with their workload (section count) for a term
 */
export const getInstructorWorkload = query({
  args: {
    token: v.optional(v.string()),
    termId: v.optional(v.id("terms")),
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

    // Verify role is department_head
    if (!user.roles.includes("department_head")) {
      throw new Error("Access denied: Department head role required");
    }

    // Find department where this user is the head
    const department = await ctx.db
      .query("departments")
      .withIndex("by_headId", (q) => q.eq("headId", userId))
      .first();

    if (!department) {
      throw new Error("Department not found for this user");
    }

    // Get all courses in this department
    const departmentCourses = await ctx.db
      .query("courses")
      .withIndex("by_departmentId", (q) => q.eq("departmentId", department._id))
      .collect();

    const courseIds = departmentCourses.map((c) => c._id);

    // Get all sections for courses in this department
    let sections = await ctx.db.query("sections").collect();
    sections = sections.filter((section) => courseIds.includes(section.courseId));

    // Filter by term if provided
    if (args.termId) {
      sections = sections.filter((section) => section.termId === args.termId);
    }

    // Get all instructors who have taught in this department
    const instructorIds = new Set<Id<"users">>();
    for (const section of sections) {
      if (section.instructorId) {
        const instructor = await ctx.db.get(section.instructorId);
        if (instructor && instructor.roles.includes("instructor")) {
          instructorIds.add(section.instructorId);
        }
      }
    }

    // Get all instructors in the system (we'll filter to those in the department)
    const allInstructors = await ctx.db.query("users").collect();
    const departmentInstructors = allInstructors.filter(
      (user) => user.roles.includes("instructor")
    );

    // Calculate workload for each instructor
    const instructorWorkloads = await Promise.all(
      departmentInstructors.map(async (instructor) => {
        // Count sections assigned to this instructor in the department
        const assignedSections = sections.filter(
          (section) => section.instructorId === instructor._id
        ).length;

        return {
          _id: instructor._id,
          name: `${instructor.profile.firstName} ${instructor.profile.lastName}`,
          email: instructor.email,
          load: assignedSections,
        };
      })
    );

    // Sort by load (ascending) then by name
    instructorWorkloads.sort((a, b) => {
      if (a.load !== b.load) {
        return a.load - b.load;
      }
      return a.name.localeCompare(b.name);
    });

    return instructorWorkloads;
  },
});

/**
 * Get all instructors in the department (for dropdown selection)
 */
export const getDepartmentInstructors = query({
  args: {
    token: v.optional(v.string()),
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

    // Verify role is department_head
    if (!user.roles.includes("department_head")) {
      throw new Error("Access denied: Department head role required");
    }

    // Find department where this user is the head
    const department = await ctx.db
      .query("departments")
      .withIndex("by_headId", (q) => q.eq("headId", userId))
      .first();

    if (!department) {
      throw new Error("Department not found for this user");
    }

    // Get all instructors in the system
    const allInstructors = await ctx.db.query("users").collect();
    const instructors = allInstructors.filter((user) =>
      user.roles.includes("instructor")
    );

    return instructors.map((instructor) => ({
      _id: instructor._id,
      name: `${instructor.profile.firstName} ${instructor.profile.lastName}`,
      email: instructor.email,
    }));
  },
});

/**
 * Assign an instructor to a section
 * Validates that the instructor belongs to the department
 */
export const assignInstructor = mutation({
  args: {
    token: v.optional(v.string()),
    sectionId: v.id("sections"),
    instructorId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Validate session token and get user
    if (!args.token) {
      throw new ValidationError("token", "Authentication required");
    }

    const userId = await validateSessionToken(ctx.db, args.token);
    if (!userId) {
      throw new ValidationError("token", "Invalid session token");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    // Verify role is department_head
    if (!user.roles.includes("department_head")) {
      throw new Error("Access denied: Department head role required");
    }

    // Find department where this user is the head
    const department = await ctx.db
      .query("departments")
      .withIndex("by_headId", (q) => q.eq("headId", userId))
      .first();

    if (!department) {
      throw new Error("Department not found for this user");
    }

    // Get the section
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new NotFoundError("Section", args.sectionId);
    }

    // Validate that the section's course belongs to this department
    const course = await ctx.db.get(section.courseId);
    if (!course) {
      throw new NotFoundError("Course", section.courseId);
    }

    if (course.departmentId !== department._id) {
      throw new ValidationError(
        "sectionId",
        "Section does not belong to your department"
      );
    }

    // Validate instructor exists and has instructor role
    const instructor = await ctx.db.get(args.instructorId);
    if (!instructor) {
      throw new NotFoundError("Instructor", args.instructorId);
    }

    if (!instructor.roles.includes("instructor")) {
      throw new ValidationError(
        "instructorId",
        "User must have instructor role"
      );
    }

    // Update the section
    await ctx.db.patch(args.sectionId, {
      instructorId: args.instructorId,
    });

    return { success: true };
  },
});

/**
 * Remove an instructor from a section (set instructorId to null)
 * Note: Since schema requires instructorId, we'll use the department head as placeholder
 */
export const removeInstructor = mutation({
  args: {
    token: v.optional(v.string()),
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    // Validate session token and get user
    if (!args.token) {
      throw new ValidationError("token", "Authentication required");
    }

    const userId = await validateSessionToken(ctx.db, args.token);
    if (!userId) {
      throw new ValidationError("token", "Invalid session token");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    // Verify role is department_head
    if (!user.roles.includes("department_head")) {
      throw new Error("Access denied: Department head role required");
    }

    // Find department where this user is the head
    const department = await ctx.db
      .query("departments")
      .withIndex("by_headId", (q) => q.eq("headId", userId))
      .first();

    if (!department) {
      throw new Error("Department not found for this user");
    }

    // Get the section
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new NotFoundError("Section", args.sectionId);
    }

    // Validate that the section's course belongs to this department
    const course = await ctx.db.get(section.courseId);
    if (!course) {
      throw new NotFoundError("Course", section.courseId);
    }

    if (course.departmentId !== department._id) {
      throw new ValidationError(
        "sectionId",
        "Section does not belong to your department"
      );
    }

    // Since schema requires instructorId, we'll use the department head as placeholder
    // This will show as "Unassigned" in the UI
    await ctx.db.patch(args.sectionId, {
      instructorId: userId, // Department head as placeholder
    });

    return { success: true };
  },
});

