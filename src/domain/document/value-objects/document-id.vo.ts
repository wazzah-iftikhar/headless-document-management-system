import { Schema } from "@effect/schema";
import { pipe } from "effect";

/**
 * UUID v4 validation schema
 * Validates that a string is a valid UUID format
 */
const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const DocumentIdSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => uuidV4Regex.test(str),
    { message: () => "Invalid UUID v4 format for DocumentId" }
  )
);

export type DocumentId = Schema.Schema.Type<typeof DocumentIdSchema>;
