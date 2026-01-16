import { Schema } from "@effect/schema";
import {
  DocumentIdSchema,
  DateTimeSchema,
  FileReferenceSchema,
  FileChecksumSchema,
  MetadataTagsSchema,
} from "./value-objects";

/**
 * Document Entity Schema (Domain Layer)
 * 
 * This schema defines the core Document entity with:
 * - Proper field types using value objects
 * - Optional properties using Schema.optional
 * - Invariants enforced via schema guards
 * - No infrastructure concerns (pure domain)
 */
export const DocumentSchema = Schema.Struct({
  id: DocumentIdSchema,
  fileReference: FileReferenceSchema,
  fileSize: pipe(
    Schema.Number,
    Schema.filter(
      (size) => size > 0,
      { message: () => "File size must be greater than 0" }
    )
  ),
  checksum: Schema.optional(FileChecksumSchema),
  metadataTags: MetadataTagsSchema,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type DocumentDomain = Schema.Schema.Type<typeof DocumentSchema>;

/**
 * Document Persistence Schema
 * 
 * Schema for encoding/decoding between domain and persistence layers.
 * This handles the transformation between:
 * - Domain types (UUID, Date objects, value objects)
 * - Persistence types (strings, primitives)
 */
export const DocumentPersistenceSchema = Schema.Struct({
  id: Schema.String, // UUID as string in database
  filename: Schema.String,
  originalFilename: Schema.String,
  filePath: Schema.String,
  fileSize: Schema.Number,
  checksum: Schema.optional(Schema.String), // SHA-256 as string
  metadataTags: Schema.String, // JSON array as string
  createdAt: Schema.String, // ISO DateTime string
  updatedAt: Schema.String, // ISO DateTime string
});

export type DocumentPersistence = Schema.Schema.Type<typeof DocumentPersistenceSchema>;
