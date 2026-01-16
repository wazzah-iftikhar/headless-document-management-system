import { Schema } from "@effect/schema";
import { pipe } from "effect";
import { DocumentIdSchema, DateTimeSchema } from "./value-objects";

/**
 * DocumentVersion Entity Schema (Domain Layer)
 * 
 * Tracks versions of a document over time.
 * Each version represents a snapshot of a document at a point in time.
 */
export const DocumentVersionSchema = Schema.Struct({
  id: Schema.String, // Version ID (UUID v4)
  documentId: DocumentIdSchema, // Reference to the parent Document
  versionNumber: pipe(
    Schema.Number,
    Schema.filter(
      (num) => num >= 1 && Number.isInteger(num),
      { message: () => "Version number must be a positive integer >= 1" }
    )
  ),
  createdAt: DateTimeSchema,
});

export type DocumentVersionDomain = Schema.Schema.Type<typeof DocumentVersionSchema>;

/**
 * DocumentVersion Persistence Schema
 * 
 * Schema for encoding/decoding between domain and persistence layers.
 */
export const DocumentVersionPersistenceSchema = Schema.Struct({
  id: Schema.String, // Version ID (UUID as string)
  documentId: Schema.String, // Document ID (UUID as string)
  versionNumber: Schema.Number,
  createdAt: Schema.String, // ISO DateTime string
});

export type DocumentVersionPersistence = Schema.Schema.Type<typeof DocumentVersionPersistenceSchema>;
