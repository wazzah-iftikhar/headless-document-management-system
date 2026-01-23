import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema/ParseError";

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

/**
 * FileChecksum Value Object
 * 
 * Encapsulates a validated SHA-256 file checksum.
 * Immutable with value semantics.
 */
export class FileChecksumVO {
  private constructor(private readonly value: FileChecksum) {}

  /**
   * Static factory method - creates FileChecksum from string
   * Validates using Effect Schema
   */
  static fromString(checksum: string): Effect.Effect<FileChecksumVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(FileChecksumSchema)(checksum),
      Effect.map((cs) => new FileChecksumVO(cs))
    );
  }

  /**
   * For persistence layer - encode to string
   */
  encode(): string {
    return this.value;
  }

  /**
   * Value semantics - equality by value
   */
  equals(other: FileChecksumVO): boolean {
    return this.value === other.value;
  }

  /**
   * String representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get the raw value (use sparingly, prefer encode())
   */
  getValue(): FileChecksum {
    return this.value;
  }
}
