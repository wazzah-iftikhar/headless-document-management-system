import { text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Shared Columns for Database Tables
 * 
 * Provides common column definitions that are used across multiple tables:
 * - id: UUID v4 primary key (app-generated, not auto-increment)
 * - createdAt: ISO timestamp string
 * - updatedAt: ISO timestamp string
 * 
 * All tables use UUID v4 for primary keys as per domain requirements.
 */
export const sharedColumns = {
  /**
   * UUID v4 primary key column
   * Stored as TEXT in SQLite, validated as UUID v4 in domain layer
   */
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),

  /**
   * Created timestamp
   * ISO 8601 string format (e.g., "2024-01-01T00:00:00.000Z")
   */
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),

  /**
   * Updated timestamp
   * ISO 8601 string format, updated on row modification
   */
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
};
