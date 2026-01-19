import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * Policy Effect enum
 * Defines whether the policy allows or denies access
 */
export enum PolicyEffect {
  ALLOW = "allow",
  DENY = "deny",
}

/**
 * Policy Effect validation schema
 */
export const PolicyEffectSchema = Schema.Literal(
  PolicyEffect.ALLOW,
  PolicyEffect.DENY
);

export type PolicyEffect = Schema.Schema.Type<typeof PolicyEffectSchema>;

/**
 * PolicyEffect Value Object
 * 
 * Encapsulates whether a policy allows or denies access.
 * Immutable with value semantics.
 */
export class PolicyEffectVO {
  private constructor(private readonly value: PolicyEffect) {}

  static fromString(value: string): Effect.Effect<PolicyEffectVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(PolicyEffectSchema)(value),
      Effect.map((effect) => new PolicyEffectVO(effect))
    );
  }

  static allow(): PolicyEffectVO {
    return new PolicyEffectVO(PolicyEffect.ALLOW);
  }

  static deny(): PolicyEffectVO {
    return new PolicyEffectVO(PolicyEffect.DENY);
  }

  encode(): string {
    return this.value;
  }

  equals(other: PolicyEffectVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): PolicyEffect {
    return this.value;
  }

  isAllow(): boolean {
    return this.value === PolicyEffect.ALLOW;
  }

  isDeny(): boolean {
    return this.value === PolicyEffect.DENY;
  }
}
