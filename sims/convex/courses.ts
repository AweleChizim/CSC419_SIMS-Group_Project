/**
 * Courses Management Functions
 *
 * Provides queries for fetching courses with filtering and search capabilities.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { validateSessionToken } from "./lib/session";

/**
 * List public courses with filtering and search
 * 
 * For students: Only shows courses from their department and matching their level
 * For other users: Shows all courses (can filter by department)
 * 
 * Supports:
 * - Search by course code or title
 * - Filter by department
 * - Automatic filtering by student's department and level
 */
export const listPublic = query({
  args: {
    token: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    departmentId: v.optional(v.id("departments")),
  },
  handler: async (ctx, args) => {
    // Get current user if token is provided
    let studentDepartmentId: Id<"departments"> | null = null;
    let studentLevel: string | null = null;

    if (args.token) {
      const userId = await validateSessionToken(ctx.db, args.token);
      if (userId) {
        // Check if user is a student
        const user = await ctx.db.get(userId);
        if (user && user.roles.includes("student")) {
          const student = await ctx.db
            .query("students")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();
          
          if (student) {
            studentDepartmentId = student.departmentId;
            studentLevel = student.level;
          }
        }
      }
    }

    // Start with all courses
    let courses = await ctx.db.query("courses").collect();

    // If user is a student, filter by their department and level
    if (studentDepartmentId && studentLevel) {
      courses = courses.filter(
        (course) =>
          course.departmentId === studentDepartmentId &&
          course.level === studentLevel
      );
    } else if (studentDepartmentId) {
      // If student but no level match, still filter by department
      courses = courses.filter(
        (course) => course.departmentId === studentDepartmentId
      );
    }

    // Apply department filter if provided (and user is not a student)
    if (args.departmentId && !studentDepartmentId) {
      courses = courses.filter(
        (course) => course.departmentId === args.departmentId
      );
    }

    // Apply search filter if provided
    if (args.searchQuery) {
      const searchLower = args.searchQuery.toLowerCase();
      courses = courses.filter(
        (course) =>
          course.code.toLowerCase().includes(searchLower) ||
          course.title.toLowerCase().includes(searchLower)
      );
    }

    // Fetch department information for each course
    const coursesWithDepartments = await Promise.all(
      courses.map(async (course) => {
        const department = await ctx.db.get(course.departmentId);
        
        return {
          _id: course._id,
          code: course.code,
          title: course.title,
          credits: course.credits,
          department: department
            ? {
                _id: department._id,
                name: department.name,
              }
            : null,
          level: course.level,
        };
      })
    );

    return coursesWithDepartments;
  },
});

