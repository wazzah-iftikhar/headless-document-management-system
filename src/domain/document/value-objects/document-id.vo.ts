import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema/ParseError";

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

/**
 * DocumentId Value Object
 * 
 * Encapsulates a validated UUID v4 identifier for documents.
 * Immutable with value semantics.
 */
export class DocumentIdVO {
  private constructor(private readonly value: DocumentId) {}

  /**
   * Static factory method - creates DocumentId from string
   * Validates using Effect Schema
   */
  static fromString(value: string): Effect.Effect<DocumentIdVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(DocumentIdSchema)(value),
      Effect.map((id) => new DocumentIdVO(id))
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
  equals(other: DocumentIdVO): boolean {
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
  getValue(): DocumentId {
    return this.value;
  }
}
