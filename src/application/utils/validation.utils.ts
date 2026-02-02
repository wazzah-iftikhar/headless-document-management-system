import { Effect } from "effect";

/**
 * Validation Utilities
 * 
 * Validation utility functions for application layer.
 * All functions return Effects for functional programming.
 */
export class ValidationUtils {
  /**
   * Validate search tags
   * Refactored to use Effect with explicit succeed and fail
   */
  static validateSearchTags(searchTags: string[]): Effect.Effect<string[], Error> {
    if (!searchTags || searchTags.length === 0) {
      return Effect.fail(new Error("At least one tag is required for search"));
    }
    return Effect.succeed(searchTags);
  }
}
