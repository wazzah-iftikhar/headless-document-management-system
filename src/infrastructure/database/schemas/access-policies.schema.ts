import { sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "../shared-columns";
import { documents } from "./documents.schema";
import { users } from "./users.schema";

/**
 * Access Policies Table Schema
 * 
 * Stores access control policies with subject-based rules.
 * A policy specifies who (subject) can do what (actions) on which resource.
 */
export const accessPolicies = sqliteTable(
  "access_policies",
  {
    ...sharedColumns,
    // Subject type: "user", "role", or "workspace"
    subjectType: text("subject_type").notNull(), // Validated in domain
    // Subject ID: UserId, Role, or WorkspaceId (as string)
    subjectId: text("subject_id").notNull(),
    // Resource type: "document", "workspace", "user", etc.
    resourceType: text("resource_type").notNull(), // Validated in domain
    // Resource ID: specific resource ID or null for wildcard (all resources)
    resourceId: text("resource_id"), // Nullable for wildcard policies
    // Actions stored as JSON array string (e.g., ["read", "write"])
    actions: text("actions").notNull().default("[]"), // JSON array as string
    // Active status
    isActive: text("is_active").notNull().default("1"), // SQLite uses text for boolean (1/0)
  },
  (table) => ({
    // Foreign key to documents (if resourceType is "document" and resourceId is set)
    // Note: SQLite doesn't support conditional FKs, so we handle this in application logic
    // Index on subjectType + subjectId for subject-based lookups
    subjectIdx: index("access_policies_subject_idx").on(
      table.subjectType,
      table.subjectId
    ),
    // Index on resourceType + resourceId for resource-based lookups
    resourceIdx: index("access_policies_resource_idx").on(
      table.resourceType,
      table.resourceId
    ),
    // Index on isActive for filtering active policies
    isActiveIdx: index("access_policies_is_active_idx").on(table.isActive),
    // Composite index for common query pattern: subject + resource + active
    subjectResourceActiveIdx: index("access_policies_subject_resource_active_idx").on(
      table.subjectType,
      table.subjectId,
      table.resourceType,
      table.resourceId,
      table.isActive
    ),
    // Index on createdAt for sorting
    createdAtIdx: index("access_policies_created_at_idx").on(table.createdAt),
  })
);

export type AccessPolicyRow = typeof accessPolicies.$inferSelect;
export type NewAccessPolicyRow = typeof accessPolicies.$inferInsert;
