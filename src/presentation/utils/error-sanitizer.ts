/**
 * Error Sanitization Utilities
 * 
 * Ensures sensitive data is not exposed in error responses.
 * 
 * Security Best Practices:
 * - Never expose stack traces to clients
 * - Never expose internal error details
 * - Never expose database schema or query details
 * - Never expose file paths or system paths
 * - Use generic error messages for internal errors
 * - Log detailed errors server-side only
 */

/**
 * Sanitize error message for client response
 * 
 * Removes sensitive information and provides safe error messages.
 * 
 * @param error - Error object or message
 * @param defaultMessage - Default message if error cannot be safely exposed
 * @returns Sanitized error message safe for client consumption
 */
export function sanitizeErrorMessage(
  error: unknown,
  defaultMessage: string = "An error occurred"
): string {
  if (typeof error === "string") {
    return sanitizeString(error, defaultMessage);
  }

  if (error instanceof Error) {
    // Never expose stack traces or internal error details
    // Only expose the message if it's safe
    return sanitizeString(error.message, defaultMessage);
  }

  return defaultMessage;
}

/**
 * Sanitize string to remove sensitive information
 */
function sanitizeString(message: string, defaultMessage: string): string {
  // Remove file paths
  message = message.replace(/\/[^\s]+/g, "[path]");
  
  // Remove absolute paths
  message = message.replace(/[A-Z]:\\[^\s]+/g, "[path]");
  
  // Remove stack trace indicators
  if (message.includes("at ") || message.includes("Stack:")) {
    return defaultMessage;
  }
  
  // Remove database-related sensitive info
  if (message.includes("SQL") || message.includes("database") || message.includes("query")) {
    return defaultMessage;
  }
  
  // Remove internal error details
  if (message.includes("internal") || message.includes("system")) {
    return defaultMessage;
  }
  
  return message;
}

/**
 * Sanitize error response object
 * 
 * Creates a safe error response without sensitive data.
 */
export function sanitizeErrorResponse(error: {
  message?: string;
  code?: string;
  details?: unknown;
}): {
  error: string;
  message: string;
} {
  return {
    error: error.code || "Error",
    message: error.message ? sanitizeErrorMessage(error.message) : "An error occurred",
  };
}

/**
 * Check if error message contains sensitive information
 */
export function containsSensitiveData(message: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i,
    /key/i,
    /credential/i,
    /\/[^\s]+/, // File paths
    /[A-Z]:\\[^\s]+/, // Windows paths
    /sql/i,
    /database/i,
    /query/i,
    /stack/i,
    /trace/i,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(message));
}
