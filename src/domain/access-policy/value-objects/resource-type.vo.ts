import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * Resource Type enum
 * Defines the types of resources that can have access policies
 */
export enum ResourceType {
  DOCUMENT = "document",
  WORKSPACE = "workspace",
  USER = "user",
}

/**
 * Resource Type validation schema
 */
export const ResourceTypeSchema = Schema.Literal(
  ResourceType.DOCUMENT,
  ResourceType.WORKSPACE,
  ResourceType.USER
);

export type ResourceTypeValue = Schema.Schema.Type<typeof ResourceTypeSchema>;

/**
 * ResourceType Value Object
 * 
 * Encapsulates the type of resource.
 * Immutable with value semantics.
 */
export class ResourceTypeVO {
  private constructor(private readonly value: ResourceTypeValue) {}

  static fromString(value: string): Effect.Effect<ResourceTypeVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(ResourceTypeSchema)(value),
      Effect.map((type) => new ResourceTypeVO(type))
    );
  }

  static document(): ResourceTypeVO {
    return new ResourceTypeVO(ResourceType.DOCUMENT);
  }

  static workspace(): ResourceTypeVO {
    return new ResourceTypeVO(ResourceType.WORKSPACE);
  }

  static user(): ResourceTypeVO {
    return new ResourceTypeVO(ResourceType.USER);
  }

  encode(): string {
    return this.value;
  }

  equals(other: ResourceTypeVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): ResourceTypeValue {
    return this.value;
  }

  isDocument(): boolean {
    return this.value === ResourceType.DOCUMENT;
  }
}
