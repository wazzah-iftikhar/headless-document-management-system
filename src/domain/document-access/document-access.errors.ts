/**
 * Document Access Domain Errors
 * 
 * Pure domain errors related to document access permission evaluation.
 * These represent business rule violations in access control.
 */
export type DocumentAccessError =
  | { _tag: "InvalidUser"; message: string }
  | { _tag: "InvalidDocument"; message: string }
  | { _tag: "InvalidPolicy"; message: string }
  | { _tag: "InvalidPermissionAction"; message: string }
  | { _tag: "UserNotActive"; userId: string }
  | { _tag: "PolicyEvaluationFailed"; message: string; reason: string };

/**
 * Helper to create InvalidUser error
 */
export const invalidUser = (message: string): DocumentAccessError => ({
  _tag: "InvalidUser",
  message,
});

/**
 * Helper to create InvalidDocument error
 */
export const invalidDocument = (message: string): DocumentAccessError => ({
  _tag: "InvalidDocument",
  message,
});

/**
 * Helper to create InvalidPolicy error
 */
export const invalidPolicy = (message: string): DocumentAccessError => ({
  _tag: "InvalidPolicy",
  message,
});

/**
 * Helper to create UserNotActive error
 */
export const userNotActive = (userId: string): DocumentAccessError => ({
  _tag: "UserNotActive",
  userId,
});

/**
 * Helper to create PolicyEvaluationFailed error
 */
export const policyEvaluationFailed = (
  message: string,
  reason: string
): DocumentAccessError => ({
  _tag: "PolicyEvaluationFailed",
  message,
  reason,
});
