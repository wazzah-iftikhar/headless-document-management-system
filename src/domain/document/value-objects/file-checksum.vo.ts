import { Schema } from "@effect/schema";
import { pipe } from "effect";

/**
 * SHA-256 checksum validation schema
 * Validates that a string is a valid SHA-256 hash (64 hex characters)
 */
export const FileChecksumSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => /^[a-f0-9]{64}$/i.test(str),
    { message: () => "Invalid SHA-256 checksum format (must be 64 hex characters)" }
  )
);

export type FileChecksum = Schema.Schema.Type<typeof FileChecksumSchema>;
