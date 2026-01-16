import { Schema } from "@effect/schema";
import { pipe } from "effect";

/**
 * Individual tag validation - non-empty string, max 50 characters
 */
const tagSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => str.length > 0 && str.length <= 50,
    { message: () => "Tag must be between 1 and 50 characters" }
  )
);

/**
 * Metadata tags value object schema
 * Array of validated tags
 */
export const MetadataTagsSchema = Schema.Array(tagSchema);

export type MetadataTags = Schema.Schema.Type<typeof MetadataTagsSchema>;
