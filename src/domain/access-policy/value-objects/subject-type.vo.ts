import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * Subject Type enum
 * Defines the types of subjects that can have access policies
 */
export enum SubjectType {
  USER = "user",
  ROLE = "role",
  WORKSPACE = "workspace",
}

/**
 * Subject Type validation schema
 */
export const SubjectTypeSchema = Schema.Literal(
  SubjectType.USER,
  SubjectType.ROLE,
  SubjectType.WORKSPACE
);

export type SubjectTypeValue = Schema.Schema.Type<typeof SubjectTypeSchema>;

/**
 * SubjectType Value Object
 * 
 * Encapsulates the type of subject (user, role, or workspace).
 * Immutable with value semantics.
 */
export class SubjectTypeVO {
  private constructor(private readonly value: SubjectTypeValue) {}

  static fromString(value: string): Effect.Effect<SubjectTypeVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(SubjectTypeSchema)(value),
      Effect.map((type) => new SubjectTypeVO(type))
    );
  }

  static user(): SubjectTypeVO {
    return new SubjectTypeVO(SubjectType.USER);
  }

  static role(): SubjectTypeVO {
    return new SubjectTypeVO(SubjectType.ROLE);
  }

  static workspace(): SubjectTypeVO {
    return new SubjectTypeVO(SubjectType.WORKSPACE);
  }

  encode(): string {
    return this.value;
  }

  equals(other: SubjectTypeVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): SubjectTypeValue {
    return this.value;
  }

  isUser(): boolean {
    return this.value === SubjectType.USER;
  }

  isRole(): boolean {
    return this.value === SubjectType.ROLE;
  }

  isWorkspace(): boolean {
    return this.value === SubjectType.WORKSPACE;
  }
}
