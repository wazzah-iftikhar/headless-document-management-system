/**
 * HTTP utility functions
 */
export class HttpUtils {
  /**
   * Map error messages to HTTP status codes
   */
  static getStatusFromError(error: Error): number {
    const message = error.message.toLowerCase();

    if (message.includes("not found")) return 404;
    if (
      message.includes("only pdf") ||
      message.includes("size") ||
      message.includes("required")
    ) {
      return 400;
    }
    return 500;
  }
}

