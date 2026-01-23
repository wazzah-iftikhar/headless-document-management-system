import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { UserDomainError } from "./user.errors";
import {
  UserIdVO,
  UserIdSchema,
  EmailVO,
  EmailSchema,
  RoleVO,
  RoleSchema,
  WorkspaceIdVO,
  WorkspaceIdSchema,
} from "./value-objects";
import { DateTimeVO, DateTimeSchema } from "../document/value-objects/date-time.vo";

/**
 * User Domain Guards
 * 
 * Validation functions that enforce domain invariants.
 * These guards use Effect Schema for validation and return Effect types.
 */

/**
 * Guard: Validates a string is a valid UserId (UUID v4)
 */
export const isUserId = (value: unknown): value is string => {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

/**
 * Guard: Validates and creates UserIdVO from string
 */
export const validateUserId = (
  value: unknown
): Effect.Effect<UserIdVO, UserDomainError> => {
  if (!isUserId(value)) {
    return Effect.fail({
      _tag: "InvalidUserId",
      message: `Invalid user ID format: ${value}`,
    });
  }
  return pipe(
    UserIdVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidUserId" as const,
      message: "Failed to parse user ID",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates a string is a valid email format
 */
export const isValidEmail = (value: unknown): value is string => {
  return typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
    value.length <= 255;
};

/**
 * Guard: Validates and creates EmailVO from string
 */
export const validateEmail = (
  value: unknown
): Effect.Effect<EmailVO, UserDomainError> => {
  if (!isValidEmail(value)) {
    return Effect.fail({
      _tag: "InvalidEmail",
      message: `Invalid email format: ${value}`,
    });
  }
  return pipe(
    EmailVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidEmail" as const,
      message: "Failed to parse email",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates a string is a valid role
 */
export const isValidRole = (value: unknown): value is string => {
  return typeof value === "string" &&
    ["admin", "manager", "editor", "viewer"].includes(value.toLowerCase());
};

/**
 * Guard: Validates and creates RoleVO from string
 */
export const validateRole = (
  value: unknown
): Effect.Effect<RoleVO, UserDomainError> => {
  if (!isValidRole(value)) {
    return Effect.fail({
      _tag: "InvalidRole",
      message: `Invalid role: ${value}. Must be one of: admin, manager, editor, viewer`,
    });
  }
  return pipe(
    RoleVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidRole" as const,
      message: "Failed to parse role",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates a string is a valid WorkspaceId (UUID v4)
 */
export const isWorkspaceId = (value: unknown): value is string => {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

/**
 * Guard: Validates and creates WorkspaceIdVO from string
 */
export const validateWorkspaceId = (
  value: unknown
): Effect.Effect<WorkspaceIdVO, UserDomainError> => {
  if (!isWorkspaceId(value)) {
    return Effect.fail({
      _tag: "InvalidWorkspaceId",
      message: `Invalid workspace ID format: ${value}`,
    });
  }
  return pipe(
    WorkspaceIdVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidWorkspaceId" as const,
      message: "Failed to parse workspace ID",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates and creates DateTimeVO from ISO string
 */
export const validateDateTime = (
  isoString: string
): Effect.Effect<DateTimeVO, UserDomainError> => {
  return pipe(
    DateTimeVO.fromISOString(isoString),
    Effect.mapError((parseError) => ({
      _tag: "InvalidDateTime" as const,
      message: "Failed to parse DateTime",
      cause: parseError,
    }))
  );
};
