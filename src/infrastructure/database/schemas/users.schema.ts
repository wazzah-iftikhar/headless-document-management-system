import { sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sharedColumns } from "../shared-columns";

/**
 * Users Table Schema
 * 
 * Stores user accounts with role-based access control and workspace associations.
 * Uses UUID v4 for primary key (app-generated).
 */
export const users = sqliteTable(
  "users",
  {
    ...sharedColumns,
    // Email - must be unique
    email: text("email").notNull(), // Validated in domain layer
    // Role - stored as string (validated in domain: admin, manager, editor, viewer)
    role: text("role").notNull().default("viewer"),
    // Workspace IDs stored as JSON array string
    workspaceIds: text("workspace_ids").notNull().default("[]"), // JSON array as string
    // Active status
    isActive: text("is_active").notNull().default("1"), // SQLite uses text for boolean (1/0)
  },
  (table) => ({
    // Unique constraint on email
    emailUnique: uniqueIndex("users_email_unique").on(table.email),
    // Index on email for lookups
    emailIdx: index("users_email_idx").on(table.email),
    // Index on role for role-based queries
    roleIdx: index("users_role_idx").on(table.role),
    // Index on isActive for filtering active users
    isActiveIdx: index("users_is_active_idx").on(table.isActive),
    // Index on createdAt for sorting
    createdAtIdx: index("users_created_at_idx").on(table.createdAt),
  })
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
