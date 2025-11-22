/**
 * Audit Log Service
 * 
 * Service for creating audit log entries for system events.
 * 
 * Required Events to Log:
 * - StudentEnrolled
 * - StudentDropped
 * - CourseGradePosted
 * - GradeEdited
 * - GraduationApproved
 * - SectionCancelled
 * - UserRoleChanged
 */

import { DatabaseWriter } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  entity: string; // Entity type (e.g., "enrollment", "grade", "user")
  entityId?: string; // ID of the affected entity
  action: string; // Action performed (e.g., "StudentEnrolled", "GradeEdited")
  userId: Id<"users">; // User who performed the action
  timestamp: number; // Unix timestamp
  details: Record<string, any>; // Relevant details (e.g., { "previousGrade": "A", "newGrade": "B" })
}

/**
 * Creates an audit log entry
 * 
 * @param db Database writer
 * @param entity Entity type (e.g., "enrollment", "grade", "user")
 * @param action Action performed (e.g., "StudentEnrolled", "GradeEdited")
 * @param userId User who performed the action
 * @param entityId Optional ID of the affected entity
 * @param details Optional details about the action
 */
export async function createAuditLog(
  db: DatabaseWriter,
  entity: string,
  action: string,
  userId: Id<"users">,
  entityId?: string,
  details?: Record<string, any>
): Promise<Id<"auditLogs">> {
  return await db.insert("auditLogs", {
    entity,
    action,
    userId,
    timestamp: Date.now(),
    details: {
      ...(entityId && { entityId }),
      ...(details || {}),
    },
  });
}

/**
 * Convenience functions for common audit events
 */

export async function logStudentEnrolled(
  db: DatabaseWriter,
  userId: Id<"users">,
  enrollmentId: Id<"enrollments">,
  details?: Record<string, any>
): Promise<Id<"auditLogs">> {
  return createAuditLog(
    db,
    "enrollment",
    "StudentEnrolled",
    userId,
    enrollmentId,
    details
  );
}

export async function logStudentDropped(
  db: DatabaseWriter,
  userId: Id<"users">,
  enrollmentId: Id<"enrollments">,
  details?: Record<string, any>
): Promise<Id<"auditLogs">> {
  return createAuditLog(
    db,
    "enrollment",
    "StudentDropped",
    userId,
    enrollmentId,
    details
  );
}

export async function logCourseGradePosted(
  db: DatabaseWriter,
  userId: Id<"users">,
  gradeId: Id<"grades">,
  details?: Record<string, any>
): Promise<Id<"auditLogs">> {
  return createAuditLog(
    db,
    "grade",
    "CourseGradePosted",
    userId,
    gradeId,
    details
  );
}

export async function logGradeEdited(
  db: DatabaseWriter,
  userId: Id<"users">,
  gradeId: Id<"grades">,
  previousGrade: string,
  newGrade: string,
  details?: Record<string, any>
): Promise<Id<"auditLogs">> {
  return createAuditLog(
    db,
    "grade",
    "GradeEdited",
    userId,
    gradeId,
    {
      previousGrade,
      newGrade,
      ...details,
    }
  );
}

export async function logGraduationApproved(
  db: DatabaseWriter,
  userId: Id<"users">,
  graduationId: Id<"graduationRecords">,
  details?: Record<string, any>
): Promise<Id<"auditLogs">> {
  return createAuditLog(
    db,
    "graduation",
    "GraduationApproved",
    userId,
    graduationId,
    details
  );
}

export async function logSectionCancelled(
  db: DatabaseWriter,
  userId: Id<"users">,
  sectionId: Id<"sections">,
  details?: Record<string, any>
): Promise<Id<"auditLogs">> {
  return createAuditLog(
    db,
    "section",
    "SectionCancelled",
    userId,
    sectionId,
    details
  );
}

export async function logUserRoleChanged(
  db: DatabaseWriter,
  userId: Id<"users">,
  targetUserId: Id<"users">,
  previousRoles: string[],
  newRoles: string[],
  details?: Record<string, any>
): Promise<Id<"auditLogs">> {
  return createAuditLog(
    db,
    "user",
    "UserRoleChanged",
    userId,
    targetUserId,
    {
      previousRoles,
      newRoles,
      ...details,
    }
  );
}

