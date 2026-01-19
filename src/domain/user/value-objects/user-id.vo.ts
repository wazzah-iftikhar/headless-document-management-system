import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * UUID v4 validation schema for User ID
 */
const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const UserIdSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => uuidV4Regex.test(str),
    { message: () => "Invalid UUID v4 format for UserId" }
  )
);

export type UserId = Schema.Schema.Type<typeof UserIdSchema>;

/**
 * UserId Value Object
 * 
 * Encapsulates a validated UUID v4 identifier for users.
 * Immutable with value semantics.
 */
export class UserIdVO {
  private constructor(private readonly value: UserId) {}

  static fromString(value: string): Effect.Effect<UserIdVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(UserIdSchema)(value),
      Effect.map((id) => new UserIdVO(id))
    );
  }

  encode(): string {
    return this.value;
  }

  equals(other: UserIdVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): UserId {
    return this.value;
  }
}
