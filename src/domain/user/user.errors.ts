import type { ParseError } from "@effect/schema";

/**
 * User Domain Errors
 * 
 * Pure domain errors related to User entity operations.
 * These represent business rule violations and domain invariants.
 */
export type UserDomainError =
  // Value Object Creation Errors
  | { _tag: "InvalidUserId"; message: string; cause?: ParseError }
  | { _tag: "InvalidEmail"; message: string; cause?: ParseError }
  | { _tag: "InvalidRole"; message: string; cause?: ParseError }
  | { _tag: "InvalidWorkspaceId"; message: string; cause?: ParseError }
  | { _tag: "InvalidDateTime"; message: string; cause?: ParseError }

  // User Entity Creation Errors
  | { _tag: "UserCreationFailed"; message: string; reason: string }
  | { _tag: "UserNotFound"; userId: string }
  | { _tag: "EmailAlreadyExists"; email: string }

  // Workspace Association Errors
  | { _tag: "WorkspaceNotFound"; workspaceId: string }
  | { _tag: "UserNotInWorkspace"; userId: string; workspaceId: string };

/**
 * Helper to create InvalidUserId error
 */
export const invalidUserId = (
  message: string,
  cause?: ParseError
): UserDomainError => ({
  _tag: "InvalidUserId",
  message,
  cause,
});

/**
 * Helper to create InvalidEmail error
 */
export const invalidEmail = (
  message: string,
  cause?: ParseError
): UserDomainError => ({
  _tag: "InvalidEmail",
  message,
  cause,
});

/**
 * Helper to create InvalidRole error
 */
export const invalidRole = (
  message: string,
  cause?: ParseError
): UserDomainError => ({
  _tag: "InvalidRole",
  message,
  cause,
});

/**
 * Helper to create UserNotFound error
 */
export const userNotFound = (userId: string): UserDomainError => ({
  _tag: "UserNotFound",
  userId,
});

/**
 * Helper to create EmailAlreadyExists error
 */
export const emailAlreadyExists = (email: string): UserDomainError => ({
  _tag: "EmailAlreadyExists",
  email,
});
