import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const downloadTokens = sqliteTable("download_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  token: text("token").notNull().unique(),
  documentId: integer("document_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  usedAt: text("used_at"), // Track when token was used (optional)
});

export type DownloadToken = typeof downloadTokens.$inferSelect;
export type NewDownloadToken = typeof downloadTokens.$inferInsert;

