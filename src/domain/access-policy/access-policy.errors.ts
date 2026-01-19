import type { ParseError } from "@effect/schema";

/**
 * AccessPolicy Domain Errors
 * 
 * Pure domain errors related to AccessPolicy entity operations.
 * These represent business rule violations and domain invariants.
 */
export type AccessPolicyDomainError =
  // Value Object Creation Errors
  | { _tag: "InvalidPolicyId"; message: string; cause?: ParseError }
  | { _tag: "InvalidSubjectType"; message: string; cause?: ParseError }
  | { _tag: "InvalidSubjectId"; message: string; cause?: ParseError }
  | { _tag: "InvalidResourceType"; message: string; cause?: ParseError }
  | { _tag: "InvalidResourceId"; message: string; cause?: ParseError }
  | { _tag: "InvalidPermissionAction"; message: string; cause?: ParseError }
  | { _tag: "InvalidDateTime"; message: string; cause?: ParseError }

  // AccessPolicy Entity Creation Errors
  | { _tag: "AccessPolicyCreationFailed"; message: string; reason: string }
  | { _tag: "AccessPolicyNotFound"; policyId: string }
  | { _tag: "InvalidActionsArray"; message: string; actions: unknown }

  // Policy Rule Errors
  | { _tag: "EmptyActionsArray"; message: string }
  | { _tag: "InvalidSubjectResourceCombination"; message: string };

/**
 * Helper to create InvalidPolicyId error
 */
export const invalidPolicyId = (
  message: string,
  cause?: ParseError
): AccessPolicyDomainError => ({
  _tag: "InvalidPolicyId",
  message,
  cause,
});

/**
 * Helper to create InvalidSubjectType error
 */
export const invalidSubjectType = (
  message: string,
  cause?: ParseError
): AccessPolicyDomainError => ({
  _tag: "InvalidSubjectType",
  message,
  cause,
});

/**
 * Helper to create InvalidSubjectId error
 */
export const invalidSubjectId = (
  message: string,
  cause?: ParseError
): AccessPolicyDomainError => ({
  _tag: "InvalidSubjectId",
  message,
  cause,
});

/**
 * Helper to create InvalidResourceType error
 */
export const invalidResourceType = (
  message: string,
  cause?: ParseError
): AccessPolicyDomainError => ({
  _tag: "InvalidResourceType",
  message,
  cause,
});

/**
 * Helper to create InvalidPermissionAction error
 */
export const invalidPermissionAction = (
  message: string,
  cause?: ParseError
): AccessPolicyDomainError => ({
  _tag: "InvalidPermissionAction",
  message,
  cause,
});

/**
 * Helper to create AccessPolicyNotFound error
 */
export const accessPolicyNotFound = (policyId: string): AccessPolicyDomainError => ({
  _tag: "AccessPolicyNotFound",
  policyId,
});

/**
 * Helper to create EmptyActionsArray error
 */
export const emptyActionsArray = (): AccessPolicyDomainError => ({
  _tag: "EmptyActionsArray",
  message: "Actions array cannot be empty",
});
