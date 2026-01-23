import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * Resource ID validation schema
 * Can be a UUID or null (null means applies to all resources of that type)
 */
export const ResourceIdSchema = Schema.Union(Schema.String, Schema.Null);

export type ResourceId = Schema.Schema.Type<typeof ResourceIdSchema>;

/**
 * ResourceId Value Object
 * 
 * Encapsulates a resource identifier.
 * Can be:
 * - Specific resource ID (UUID string) for resource-specific policies
 * - null for policies that apply to all resources of a given type
 * Immutable with value semantics.
 */
export class ResourceIdVO {
  private constructor(private readonly value: ResourceId) {}

  static fromString(value: string | null): Effect.Effect<ResourceIdVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(ResourceIdSchema)(value),
      Effect.map((id) => new ResourceIdVO(id))
    );
  }

  static forAll(): ResourceIdVO {
    return new ResourceIdVO(null);
  }

  encode(): string | null {
    return this.value;
  }

  equals(other: ResourceIdVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value ?? "*";
  }

  getValue(): ResourceId {
    return this.value;
  }

  /**
   * Check if this applies to all resources (wildcard)
   */
  isWildcard(): boolean {
    return this.value === null;
  }
}
