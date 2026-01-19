import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { ParseError } from "@effect/schema";

/**
 * UUID v4 validation schema for Workspace ID
 */
const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const WorkspaceIdSchema = pipe(
  Schema.String,
  Schema.filter(
    (str) => uuidV4Regex.test(str),
    { message: () => "Invalid UUID v4 format for WorkspaceId" }
  )
);

export type WorkspaceId = Schema.Schema.Type<typeof WorkspaceIdSchema>;

/**
 * WorkspaceId Value Object
 * 
 * Encapsulates a validated UUID v4 identifier for workspaces.
 * Immutable with value semantics.
 */
export class WorkspaceIdVO {
  private constructor(private readonly value: WorkspaceId) {}

  static fromString(value: string): Effect.Effect<WorkspaceIdVO, ParseError> {
    return pipe(
      Schema.decodeUnknown(WorkspaceIdSchema)(value),
      Effect.map((id) => new WorkspaceIdVO(id))
    );
  }

  encode(): string {
    return this.value;
  }

  equals(other: WorkspaceIdVO): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  getValue(): WorkspaceId {
    return this.value;
  }
}
