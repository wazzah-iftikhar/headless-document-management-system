/**
 * Repository Layer Errors
 * Infrastructure-level errors from database operations
 */
export type RepoError =
  | { _tag: "DbConnectionError"; message: string }
  | { _tag: "DbTimeoutError"; message: string }
  | { _tag: "DbConstraintViolation"; constraint: string; message: string }
  | { _tag: "DbUnknown"; message: string }
  | { _tag: "TokenNotFound"; token: string }
  | { _tag: "TokenExpired"; token: string };

/**
 * Helper to convert generic Error to RepoError
 */
export const toRepoError = (error: unknown): RepoError => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes("timeout") || message.includes("timed out")) {
      return { _tag: "DbTimeoutError", message: error.message };
    }
    if (message.includes("constraint") || message.includes("unique") || message.includes("foreign key")) {
      return { _tag: "DbConstraintViolation", constraint: "unknown", message: error.message };
    }
    if (message.includes("connection") || message.includes("connect")) {
      return { _tag: "DbConnectionError", message: error.message };
    }
    return { _tag: "DbUnknown", message: error.message };
  }
  return { _tag: "DbUnknown", message: String(error) };
};

