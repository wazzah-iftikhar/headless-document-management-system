/**
 * Audit Log DTOs
 * 
 * Data Transfer Objects for audit logging.
 */

import { Schema } from "@effect/schema";
import { pipe } from "effect";

/**
 * Audit Event Types
 * 
 * Critical operations that should be audited:
 * - Document operations: create, update, delete, access
 * - Access control: policy creation, updates, deletions
 * - User operations: login, logout, permission changes
 */
export type AuditEventType =
  // Document operations
  | "DOCUMENT_CREATED"
  | "DOCUMENT_UPDATED"
  | "DOCUMENT_DELETED"
  | "DOCUMENT_ACCESSED"
  | "DOCUMENT_DOWNLOADED"
  | "DOCUMENT_UPLOADED"
  // Access control operations
  | "ACCESS_POLICY_CREATED"
  | "ACCESS_POLICY_UPDATED"
  | "ACCESS_POLICY_DELETED"
  | "PERMISSION_CHECKED"
  | "PERMISSION_DENIED"
  // User operations
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_PERMISSION_CHANGED";

/**
 * Audit Log Entry Schema
 * 
 * Represents a single audit log entry.
 * All fields are required except optional details.
 */
export const AuditLogEntrySchema = Schema.Struct({
  eventType: Schema.String, // AuditEventType as string
  userId: Schema.String,
  workspaceId: Schema.String,
  userEmail: Schema.optional(Schema.String),
  userRole: Schema.optional(Schema.String),
  resourceId: Schema.String, // Document ID, Policy ID, etc.
  resourceType: Schema.String, // "document", "access_policy", "user", etc.
  details: Schema.optional(Schema.String), // JSON string with additional details
  correlationId: Schema.optional(Schema.String), // Request correlation ID
  timestamp: Schema.String, // ISO 8601 timestamp
});

export type AuditLogEntry = Schema.Schema.Type<typeof AuditLogEntrySchema>;

/**
 * Audit Log Result Schema (for queries)
 */
export const AuditLogResultSchema = Schema.Struct({
  id: Schema.String,
  eventType: Schema.String,
  userId: Schema.String,
  workspaceId: Schema.String,
  userEmail: Schema.optional(Schema.String),
  userRole: Schema.optional(Schema.String),
  resourceId: Schema.String,
  resourceType: Schema.String,
  details: Schema.optional(Schema.String),
  correlationId: Schema.optional(Schema.String),
  timestamp: Schema.String,
});

export type AuditLogResult = Schema.Schema.Type<typeof AuditLogResultSchema>;
