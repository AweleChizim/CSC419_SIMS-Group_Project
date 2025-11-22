/**
 * Section Mutations
 * 
 * Transactional operations for section management.
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { NotFoundError } from "../lib/errors";
import { validateScheduleAssignment } from "../lib/services/schedulingService";
import { logSectionCancelled } from "../lib/services/auditLogService";

/**
 * Cancel a section
 * 
 * This operation:
 * 1. Validates section exists
 * 2. Updates section status (if you have a status field)
 * 3. Notifies enrolled students (would be done via notification service)
 * 4. Creates audit log
 */
export const cancelSection = mutation({
  args: {
    sectionId: v.id("sections"),
    userId: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.sectionId);
    if (!section) {
      throw new NotFoundError("Section", args.sectionId);
    }

    // Get enrolled students count
    const enrollments = await ctx.db
      .query("enrollments")
      .withIndex("by_sectionId", (q) => q.eq("sectionId", args.sectionId))
      .filter((q) => q.eq(q.field("status"), "enrolled"))
      .collect();

    // In a real system, you might:
    // 1. Update section status to "cancelled"
    // 2. Notify all enrolled students
    // 3. Handle refunds or transfers
    // For now, we'll just create the audit log

    // Create audit log
    await logSectionCancelled(
      ctx.db,
      args.userId,
      args.sectionId,
      {
        reason: args.reason,
        enrolledStudentsCount: enrollments.length,
        courseId: section.courseId,
        termId: section.termId,
      }
    );

    return {
      success: true,
      affectedEnrollments: enrollments.length,
    };
  },
});

