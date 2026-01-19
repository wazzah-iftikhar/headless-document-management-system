import { Schema } from "@effect/schema";
import { pipe } from "effect";
import {
  UserIdSchema,
  EmailSchema,
  RoleSchema,
  WorkspaceIdSchema,
} from "./value-objects";
import { DateTimeSchema } from "../document/value-objects/date-time.vo";

/**
 * User Entity Schema (Domain Layer)
 * 
 * Defines the User entity with:
 * - Role-based access control (Role field)
 * - Workspace associations (workspaceIds array)
 * - Proper field types using value objects
 * - Optional properties where appropriate
 * - Invariants enforced via schema guards
 */
export const UserSchema = Schema.Struct({
  id: UserIdSchema,
  email: EmailSchema,
  role: RoleSchema,
  workspaceIds: Schema.Array(WorkspaceIdSchema), // User can belong to multiple workspaces
  isActive: Schema.Boolean,
  createdAt: DateTimeSchema,
  updatedAt: DateTimeSchema,
});

export type UserDomain = Schema.Schema.Type<typeof UserSchema>;

/**
 * User Persistence Schema
 * 
 * Schema for encoding/decoding between domain and persistence layers.
 */
export const UserPersistenceSchema = Schema.Struct({
  id: Schema.String, // UUID as string in database
  email: Schema.String,
  role: Schema.String, // Role as string
  workspaceIds: Schema.String, // JSON array as string
  isActive: Schema.Boolean,
  createdAt: Schema.String, // ISO DateTime string
  updatedAt: Schema.String, // ISO DateTime string
});

export type UserPersistence = Schema.Schema.Type<typeof UserPersistenceSchema>;
