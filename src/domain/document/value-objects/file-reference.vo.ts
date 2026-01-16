import { Schema } from "@effect/schema";
import { pipe } from "effect";

/**
 * File path validation - must be a non-empty string
 */
const filePathSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => str.length > 0,
    { message: () => "File path cannot be empty" }
  )
);

/**
 * File reference value object schema
 * Encapsulates filename, original filename, and file path
 */
export const FileReferenceSchema = Schema.Struct({
  filename: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0 && str.length <= 255,
      { message: () => "Filename must be between 1 and 255 characters" }
    )
  ),
  originalFilename: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0 && str.length <= 255,
      { message: () => "Original filename must be between 1 and 255 characters" }
    )
  ),
  filePath: filePathSchema,
});

export type FileReference = Schema.Schema.Type<typeof FileReferenceSchema>;
