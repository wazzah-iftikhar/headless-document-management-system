import { sqliteTable, text, integer, index, check, foreignKey, uniqueIndex } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { sharedColumns } from "../shared-columns";
import { documents } from "./documents.schema";

/**
 * Document Versions Table Schema
 * 
 * Tracks versions of documents over time.
 * Each version represents a snapshot of a document at a point in time.
 */
export const documentVersions = sqliteTable(
  "document_versions",
  {
    ...sharedColumns,
    // Foreign key to documents table
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }), // CASCADE delete when document is deleted
    // Version number - must be >= 1 and integer
    versionNumber: integer("version_number").notNull(),
  },
  (table) => ({
    // Foreign key constraint (explicit definition for clarity)
    documentFk: foreignKey({
      columns: [table.documentId],
      foreignColumns: [documents.id],
      name: "document_versions_document_id_fk",
    }),
    // Index on documentId for lookups
    documentIdIdx: index("document_versions_document_id_idx").on(table.documentId),
    // Unique constraint: one version number per document
    // This ensures we can't have duplicate version numbers for the same document
    documentVersionUnique: uniqueIndex("document_versions_document_version_unique")
      .on(table.documentId, table.versionNumber),
    // Check constraint: versionNumber must be >= 1
    versionNumberCheck: check("version_number_positive", sql`${table.versionNumber} >= 1`),
  })
);

export type DocumentVersionRow = typeof documentVersions.$inferSelect;
export type NewDocumentVersionRow = typeof documentVersions.$inferInsert;
