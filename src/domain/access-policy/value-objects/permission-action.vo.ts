import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * Access Level enum
 * Defines the hierarchy of access levels
 * Higher numbers indicate more permissions
 */
export enum AccessLevel {
  NONE = 0,
  READ = 1,
  WRITE = 2,
  DELETE = 3,
  SHARE = 4,
  MANAGE = 5, // Highest level - full access
}

/**
 * Permission Action enum
 * Defines the available permission actions with their access levels
 */
export enum PermissionAction {
  READ = "read",      // Level 1: View documents
  WRITE = "write",    // Level 2: Create and modify documents
  DELETE = "delete",  // Level 3: Remove documents
  SHARE = "share",    // Level 4: Share documents and manage access
  MANAGE = "manage",  // Level 5: Full management access (includes all below)
}

/**
 * Access Level mapping for each permission action
 * Defines which access level each action belongs to
 */
export const PermissionActionAccessLevel: Record<PermissionAction, AccessLevel> = {
  [PermissionAction.READ]: AccessLevel.READ,
  [PermissionAction.WRITE]: AccessLevel.WRITE,
  [PermissionAction.DELETE]: AccessLevel.DELETE,
  [PermissionAction.SHARE]: AccessLevel.SHARE,
  [PermissionAction.MANAGE]: AccessLevel.MANAGE,
};

/**
 * Permission Action validation schema
 */
export const PermissionActionSchema = Schema.Literal(
  PermissionAction.READ,
  PermissionAction.WRITE,
  PermissionAction.DELETE,
  PermissionAction.SHARE,
  PermissionAction.MANAGE
);

export type PermissionActionValue = Schema.Schema.Type<typeof PermissionActionSchema>;

/**
 * PermissionAction Value Object
 * 
 * Encapsulates a permission action.
 * Immutable with value semantics.
 */
export class PermissionActionVO {
  private constructor(private readonly value: PermissionActionValue) {}

  static fromString(value: string): Effect.Effect<PermissionActionVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(PermissionActionSchema)(value),
      Effect.map((action) => new PermissionActionVO(action))
    );
  }

  static read(): PermissionActionVO {
    return new PermissionActionVO(PermissionAction.READ);
  }

  static write(): PermissionActionVO {
    return new PermissionActionVO(PermissionAction.WRITE);
  }

  static delete(): PermissionActionVO {
    return new PermissionActionVO(PermissionAction.DELETE);
  }

  static share(): PermissionActionVO {
    return new PermissionActionVO(PermissionAction.SHARE);
  }

  static manage(): PermissionActionVO {
    return new PermissionActionVO(PermissionAction.MANAGE);
  }

  encode(): string {
    return this.value;
  }

  equals(other: PermissionActionVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): PermissionActionValue {
    return this.value;
  }

  /**
   * Get the access level for this permission action
   */
  getAccessLevel(): AccessLevel {
    return PermissionActionAccessLevel[this.value];
  }

  /**
   * Check if this action has at least the specified access level
   */
  hasAccessLevel(level: AccessLevel): boolean {
    return this.getAccessLevel() >= level;
  }

  /**
   * Check if this action includes read permissions
   * (All actions include read, except NONE)
   */
  includesRead(): boolean {
    return this.getAccessLevel() >= AccessLevel.READ;
  }

  /**
   * Check if action includes write permissions
   * (WRITE, DELETE, SHARE, MANAGE include write)
   */
  includesWrite(): boolean {
    return this.getAccessLevel() >= AccessLevel.WRITE;
  }

  /**
   * Check if action includes delete permissions
   * (DELETE, SHARE, MANAGE include delete)
   */
  includesDelete(): boolean {
    return this.getAccessLevel() >= AccessLevel.DELETE;
  }

  /**
   * Check if action includes share permissions
   * (SHARE, MANAGE include share)
   */
  includesShare(): boolean {
    return this.getAccessLevel() >= AccessLevel.SHARE;
  }

  /**
   * Check if action includes manage permissions
   * (Only MANAGE includes manage)
   */
  includesManage(): boolean {
    return this.getAccessLevel() >= AccessLevel.MANAGE;
  }

  /**
   * Check if this action includes another action
   * (Higher level actions include lower level actions)
   */
  includes(other: PermissionActionVO): boolean {
    return this.getAccessLevel() >= other.getAccessLevel();
  }

  /**
   * Check if this action is equal to or higher than another action
   */
  isEqualOrHigherThan(other: PermissionActionVO): boolean {
    return this.getAccessLevel() >= other.getAccessLevel();
  }
}
