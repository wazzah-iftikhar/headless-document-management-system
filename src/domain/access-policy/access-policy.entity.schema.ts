import { Schema } from "@effect/schema";
import { pipe } from "effect";
import {
  PolicyIdSchema,
  SubjectTypeSchema,
  SubjectIdSchema,
  ResourceTypeSchema,
  ResourceIdSchema,
  PermissionActionSchema,
} from "./value-objects";
import { DateTimeSchema } from "../document/value-objects/date-time.vo";

/**
 * AccessPolicy Entity Schema (Domain Layer)
 * 
 * Defines access policies with subject-based rules.
 * A policy specifies:
 * - Subject (who): user, role, or workspace
 * - Resource (what): document, workspace, etc.
 * - Actions (permissions): read, write, delete, etc.
 * 
 * Subject-based rules allow policies to be applied to:
 * - Specific users (subjectType: "user", subjectId: userId)
 * - All users with a role (subjectType: "role", subjectId: role)
 * - All users in a workspace (subjectType: "workspace", subjectId: workspaceId)
 */
export const AccessPolicySchema = Schema.Struct({
  id: PolicyIdSchema,
  subjectType: SubjectTypeSchema, // user, role, or workspace
  subjectId: SubjectIdSchema, // UserId, Role, or WorkspaceId
  resourceType: ResourceTypeSchema, // document, workspace, etc.
  resourceId: Schema.optional(ResourceIdSchema), // Specific resource ID or null for all resources
  actions: Schema.Array(PermissionActionSchema), // Array of allowed actions
  isActive: Schema.Boolean,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type AccessPolicyDomain = Schema.Schema.Type<typeof AccessPolicySchema>;

/**
 * AccessPolicy Persistence Schema
 * 
 * Schema for encoding/decoding between domain and persistence layers.
 */
export const AccessPolicyPersistenceSchema = Schema.Struct({
  id: Schema.String, // UUID as string in database
  subjectType: Schema.String, // "user", "role", or "workspace"
  subjectId: Schema.String, // Subject ID as string
  resourceType: Schema.String, // "document", "workspace", etc.
  resourceId: Schema.optional(Schema.Union(Schema.String, Schema.Null)), // Resource ID or null
  actions: Schema.String, // JSON array as string
  isActive: Schema.Boolean,
  createdAt: Schema.String, // ISO DateTime string
  updatedAt: Schema.String, // ISO DateTime string
});

export type AccessPolicyPersistence = Schema.Schema.Type<typeof AccessPolicyPersistenceSchema>;
