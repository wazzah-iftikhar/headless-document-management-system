import { Schema } from "@effect/schema";
import { Effect, Option, pipe } from "effect";
import type { ParseError } from "@effect/schema/ParseError";

/**
 * Individual tag validation - non-empty string, max 50 characters
 */
const tagSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => str.length > 0 && str.length <= 50,
    { message: () => "Tag must be between 1 and 50 characters" }
  )
);

/**
 * Metadata tags value object schema
 * Array of validated tags
 */
export const MetadataTagsSchema = Schema.Array(tagSchema);

export type MetadataTags = Schema.Schema.Type<typeof MetadataTagsSchema>;

/**
 * MetadataTags Value Object
 * 
 * Encapsulates an array of validated metadata tags.
 * Immutable with value semantics.
 * Uses Option for safe access to avoid null/undefined.
 */
export class MetadataTagsVO {
  private constructor(private readonly tags: MetadataTags) {}

  /**
   * Static factory method - creates MetadataTags from array
   * Validates using Effect Schema
   */
  static fromArray(tags: string[]): Effect.Effect<MetadataTagsVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(MetadataTagsSchema)(tags),
      Effect.map((validatedTags) => new MetadataTagsVO(validatedTags))
    );
  }

  /**
   * Static factory method - creates empty MetadataTags
   */
  static empty(): MetadataTagsVO {
    return new MetadataTagsVO([]);
  }

  /**
   * For persistence layer - encode to array
   */
  encode(): string[] {
    return [...this.tags];
  }

  /**
   * Option-based access - returns Option instead of null/undefined
   */
  getTags(): Option.Option<string[]> {
    return this.tags.length > 0 ? Option.some([...this.tags]) : Option.none();
  }

  /**
   * Check if tags contain a specific tag (case-insensitive)
   */
  hasTag(tag: string): boolean {
    return this.tags.some((t) => t.toLowerCase() === tag.toLowerCase());
  }

  /**
   * Check if tags are empty
   */
  isEmpty(): boolean {
    return this.tags.length === 0;
  }

  /**
   * Get tag count
   */
  getCount(): number {
    return this.tags.length;
  }

  /**
   * Value semantics - equality by sorted tag arrays
   */
  equals(other: MetadataTagsVO): boolean {
    if (this.tags.length !== other.tags.length) return false;
    const sortedThis = [...this.tags].sort();
    const sortedOther = [...other.tags].sort();
    return sortedThis.every((tag, i) => tag === sortedOther[i]);
  }
}
