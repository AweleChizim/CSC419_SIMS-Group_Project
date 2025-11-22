/**
 * Audit Log Service
 * 
 * Service for creating audit log entries for system events.
 */

import { DatabaseWriter } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

/**
 * Creates an audit log entry
 */
export async function createAuditLog(
  db: DatabaseWriter,
  entity: string,
  action: string,
  userId: Id<"users">,
  details?: Record<string, any>
): Promise<Id<"auditLogs">> {
  return await db.insert("auditLogs", {
    entity,
    action,
    userId,
    timestamp: Date.now(),
    details: details || {},
  });
}

