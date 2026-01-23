import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * User Role enum
 * Defines the available roles in the system
 */
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EDITOR = "editor",
  VIEWER = "viewer",
}

/**
 * Role validation schema
 * Only allows predefined roles
 */
export const RoleSchema = Schema.Literal(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.EDITOR,
  UserRole.VIEWER
);

export type Role = Schema.Schema.Type<typeof RoleSchema>;

/**
 * Role Value Object
 * 
 * Encapsulates a validated user role.
 * Immutable with value semantics.
 */
export class RoleVO {
  private constructor(private readonly value: Role) {}

  static fromString(value: string): Effect.Effect<RoleVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(RoleSchema)(value),
      Effect.map((role) => new RoleVO(role))
    );
  }

  static admin(): RoleVO {
    return new RoleVO(UserRole.ADMIN);
  }

  static manager(): RoleVO {
    return new RoleVO(UserRole.MANAGER);
  }

  static editor(): RoleVO {
    return new RoleVO(UserRole.EDITOR);
  }

  static viewer(): RoleVO {
    return new RoleVO(UserRole.VIEWER);
  }

  encode(): string {
    return this.value;
  }

  equals(other: RoleVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): Role {
    return this.value;
  }

  /**
   * Check if role has admin privileges
   */
  isAdmin(): boolean {
    return this.value === UserRole.ADMIN;
  }

  /**
   * Check if role has manager or higher privileges
   */
  isManagerOrHigher(): boolean {
    return this.value === UserRole.ADMIN || this.value === UserRole.MANAGER;
  }
}
