import { Effect } from "effect";

/**
 * HTTP utility functions
 */
export class HttpUtils {
  /**
   * Map error messages to HTTP status codes
   * Refactored to use Effect for consistency
   */
  static getStatusFromError(error: Error): Effect.Effect<number, never> {
    const message = error.message.toLowerCase();

    if (message.includes("not found")) return Effect.succeed(404);
    if (
      message.includes("only pdf") ||
      message.includes("size") ||
      message.includes("required")
    ) {
      return Effect.succeed(400);
    }
    return Effect.succeed(500);
  }
}

