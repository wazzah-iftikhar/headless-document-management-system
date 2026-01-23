import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { AccessPolicyDomainError } from "./access-policy.errors";
import {
  PolicyIdVO,
  PolicyIdSchema,
  SubjectTypeVO,
  SubjectTypeSchema,
  SubjectIdVO,
  SubjectIdSchema,
  ResourceTypeVO,
  ResourceTypeSchema,
  ResourceIdVO,
  ResourceIdSchema,
  PermissionActionVO,
  PermissionActionSchema,
} from "./value-objects";
import { DateTimeVO, DateTimeSchema } from "../document/value-objects/date-time.vo";

/**
 * AccessPolicy Domain Guards
 * 
 * Validation functions that enforce domain invariants.
 * These guards use Effect Schema for validation and return Effect types.
 */

/**
 * Guard: Validates a string is a valid PolicyId (UUID v4)
 */
export const isPolicyId = (value: unknown): value is string => {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

/**
 * Guard: Validates and creates PolicyIdVO from string
 */
export const validatePolicyId = (
  value: unknown
): Effect.Effect<PolicyIdVO, AccessPolicyDomainError> => {
  if (!isPolicyId(value)) {
    return Effect.fail({
      _tag: "InvalidPolicyId",
      message: `Invalid policy ID format: ${value}`,
    });
  }
  return pipe(
    PolicyIdVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidPolicyId" as const,
      message: "Failed to parse policy ID",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates a string is a valid SubjectType
 */
export const isValidSubjectType = (value: unknown): value is string => {
  return typeof value === "string" &&
    ["user", "role", "workspace"].includes(value.toLowerCase());
};

/**
 * Guard: Validates and creates SubjectTypeVO from string
 */
export const validateSubjectType = (
  value: unknown
): Effect.Effect<SubjectTypeVO, AccessPolicyDomainError> => {
  if (!isValidSubjectType(value)) {
    return Effect.fail({
      _tag: "InvalidSubjectType",
      message: `Invalid subject type: ${value}. Must be one of: user, role, workspace`,
    });
  }
  return pipe(
    SubjectTypeVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidSubjectType" as const,
      message: "Failed to parse subject type",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates and creates SubjectIdVO from string
 */
export const validateSubjectId = (
  value: unknown
): Effect.Effect<SubjectIdVO, AccessPolicyDomainError> => {
  if (typeof value !== "string") {
    return Effect.fail({
      _tag: "InvalidSubjectId",
      message: `Subject ID must be a string: ${value}`,
    });
  }
  return pipe(
    SubjectIdVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidSubjectId" as const,
      message: "Failed to parse subject ID",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates a string is a valid ResourceType
 */
export const isValidResourceType = (value: unknown): value is string => {
  return typeof value === "string" &&
    ["document", "workspace", "user"].includes(value.toLowerCase());
};

/**
 * Guard: Validates and creates ResourceTypeVO from string
 */
export const validateResourceType = (
  value: unknown
): Effect.Effect<ResourceTypeVO, AccessPolicyDomainError> => {
  if (!isValidResourceType(value)) {
    return Effect.fail({
      _tag: "InvalidResourceType",
      message: `Invalid resource type: ${value}. Must be one of: document, workspace, user`,
    });
  }
  return pipe(
    ResourceTypeVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidResourceType" as const,
      message: "Failed to parse resource type",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates and creates ResourceIdVO from string or null
 */
export const validateResourceId = (
  value: unknown
): Effect.Effect<ResourceIdVO, AccessPolicyDomainError> => {
  return pipe(
    ResourceIdVO.fromString(value === null || value === undefined ? null : String(value)),
    Effect.mapError((parseError) => ({
      _tag: "InvalidResourceId" as const,
      message: "Failed to parse resource ID",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates a string is a valid PermissionAction
 */
export const isValidPermissionAction = (value: unknown): value is string => {
  return typeof value === "string" &&
    ["read", "write", "delete", "share", "manage"].includes(value.toLowerCase());
};

/**
 * Guard: Validates and creates PermissionActionVO from string
 */
export const validatePermissionAction = (
  value: unknown
): Effect.Effect<PermissionActionVO, AccessPolicyDomainError> => {
  if (!isValidPermissionAction(value)) {
    return Effect.fail({
      _tag: "InvalidPermissionAction",
      message: `Invalid permission action: ${value}. Must be one of: read, write, delete, share, manage`,
    });
  }
  return pipe(
    PermissionActionVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidPermissionAction" as const,
      message: "Failed to parse permission action",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates actions array is not empty
 */
export const validateActionsArray = (
  actions: unknown[]
): Effect.Effect<PermissionActionVO[], AccessPolicyDomainError> => {
  if (!Array.isArray(actions) || actions.length === 0) {
    return Effect.fail({
      _tag: "EmptyActionsArray",
      message: "Actions array cannot be empty",
    });
  }
  return Effect.all(
    actions.map((action) => validatePermissionAction(action))
  );
};

/**
 * Guard: Validates and creates DateTimeVO from ISO string
 */
export const validateDateTime = (
  isoString: string
): Effect.Effect<DateTimeVO, AccessPolicyDomainError> => {
  return pipe(
    DateTimeVO.fromISOString(isoString),
    Effect.mapError((parseError) => ({
      _tag: "InvalidDateTime" as const,
      message: "Failed to parse DateTime",
      cause: parseError,
    }))
  );
};
