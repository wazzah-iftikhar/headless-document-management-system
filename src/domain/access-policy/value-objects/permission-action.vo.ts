import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * Permission Action enum
 * Defines the available permission actions
 */
export enum PermissionAction {
  READ = "read",
  WRITE = "write",
  DELETE = "delete",
  SHARE = "share",
  MANAGE = "manage", // Full management access
}

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
   * Check if action includes write permissions
   */
  includesWrite(): boolean {
    return (
      this.value === PermissionAction.WRITE ||
      this.value === PermissionAction.MANAGE
    );
  }

  /**
   * Check if action includes delete permissions
   */
  includesDelete(): boolean {
    return (
      this.value === PermissionAction.DELETE ||
      this.value === PermissionAction.MANAGE
    );
  }
}
