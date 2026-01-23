import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * UUID v4 validation schema for Policy ID
 */
const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PolicyIdSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => uuidV4Regex.test(str),
    { message: () => "Invalid UUID v4 format for PolicyId" }
  )
);

export type PolicyId = Schema.Schema.Type<typeof PolicyIdSchema>;

/**
 * PolicyId Value Object
 * 
 * Encapsulates a validated UUID v4 identifier for access policies.
 * Immutable with value semantics.
 */
export class PolicyIdVO {
  private constructor(private readonly value: PolicyId) {}

  static fromString(value: string): Effect.Effect<PolicyIdVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(PolicyIdSchema)(value),
      Effect.map((id) => new PolicyIdVO(id))
    );
  }

  encode(): string {
    return this.value;
  }

  equals(other: PolicyIdVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): PolicyId {
    return this.value;
  }
}
