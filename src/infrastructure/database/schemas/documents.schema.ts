import { sqliteTable, text, integer, index, check } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { sharedColumns } from "../shared-columns";

/**
 * Documents Table Schema
 * 
 * Stores document metadata and file references.
 * Uses UUID v4 for primary key (app-generated).
 */
export const documents = sqliteTable(
  "documents",
  {
    ...sharedColumns,
    // File reference fields (from FileReferenceVO)
    filename: text("filename").notNull(), // Max 255 chars (enforced in domain)
    originalFilename: text("original_filename").notNull(), // Max 255 chars
    filePath: text("file_path").notNull(),
    // File metadata
    fileSize: integer("file_size").notNull(), // Must be > 0 (enforced in domain)
    checksum: text("checksum"), // SHA-256 hash, optional
    // Metadata tags stored as JSON array string
    metadataTags: text("metadata_tags").notNull().default("[]"), // JSON array as string
  },
  (table) => ({
    // Index on filename for lookups
    filenameIdx: index("documents_filename_idx").on(table.filename),
    // Index on filePath for file system operations
    filePathIdx: index("documents_file_path_idx").on(table.filePath),
    // Index on createdAt for sorting/filtering
    createdAtIdx: index("documents_created_at_idx").on(table.createdAt),
    // Check constraint: fileSize must be positive
    fileSizeCheck: check("file_size_positive", sql`${table.fileSize} > 0`),
  })
);

export type DocumentRow = typeof documents.$inferSelect;
export type NewDocumentRow = typeof documents.$inferInsert;
