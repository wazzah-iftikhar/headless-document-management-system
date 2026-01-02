import { ok, err, type Result } from "./result";

/**
 * Validation utility functions
 * All functions return Results for functional programming
 */
export class ValidationUtils {
  /**
   * Validate search tags
   */
  static validateSearchTags(searchTags: string[]): Result<string[]> {
    if (!searchTags || searchTags.length === 0) {
      return err(new Error("At least one tag is required for search"));
    }
    return ok(searchTags);
  }
}

