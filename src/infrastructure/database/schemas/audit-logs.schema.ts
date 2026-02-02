/**
 * Audit Logs Database Schema
 * 
 * Stores immutable audit logs for compliance and debugging.
 * 
 * Audit logs should never be deleted or modified.
 */

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Audit Logs Table
 * 
 * Stores audit log entries for critical operations.
 * All fields are stored as text for flexibility.
 */
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("event_type").notNull(), // DOCUMENT_CREATED, ACCESS_POLICY_UPDATED, etc.
  userId: text("user_id").notNull(),
  workspaceId: text("workspace_id").notNull(),
  userEmail: text("user_email"), // Optional
  userRole: text("user_role"), // Optional
  resourceId: text("resource_id").notNull(), // Document ID, Policy ID, etc.
  resourceType: text("resource_type").notNull(), // "document", "access_policy", etc.
  details: text("details"), // JSON string with additional details
  correlationId: text("correlation_id"), // Request correlation ID
  timestamp: text("timestamp").notNull().default(sql`CURRENT_TIMESTAMP`), // ISO 8601 timestamp
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export type AuditLogPersistence = typeof auditLogs.$inferSelect;
export type AuditLogInsert = typeof auditLogs.$inferInsert;
