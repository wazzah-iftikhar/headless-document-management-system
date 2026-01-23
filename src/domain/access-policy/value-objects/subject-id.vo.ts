import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * Subject ID validation schema
 * Can be a UUID (for user/workspace) or a role string
 */
export const SubjectIdSchema = Schema.String;

export type SubjectId = Schema.Schema.Type<typeof SubjectIdSchema>;

/**
 * SubjectId Value Object
 * 
 * Encapsulates a subject identifier.
 * Can be:
 * - UserId (UUID) for user-based policies
 * - Role (string) for role-based policies
 * - WorkspaceId (UUID) for workspace-based policies
 * Immutable with value semantics.
 */
export class SubjectIdVO {
  private constructor(private readonly value: SubjectId) {}

  static fromString(value: string): Effect.Effect<SubjectIdVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(SubjectIdSchema)(value),
      Effect.map((id) => new SubjectIdVO(id))
    );
  }

  encode(): string {
    return this.value;
  }

  equals(other: SubjectIdVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): SubjectId {
    return this.value;
  }
}
