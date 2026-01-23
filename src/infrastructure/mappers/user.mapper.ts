import { Effect, pipe } from "effect";
import type { UserDomain, UserPersistence } from "../../domain/user/user.entity.schema";
import { Schema } from "@effect/schema";
import {
  UserIdVO,
  EmailVO,
  RoleVO,
  WorkspaceIdVO,
} from "../../domain/user/value-objects";
import { DateTimeVO } from "../../domain/document/value-objects/date-time.vo";

/**
 * User Mapper
 * 
 * Maps between domain entities (UserDomain) and persistence types (UserPersistence).
 * Handles encoding/decoding of value objects to/from their persistence representations.
 */

/**
 * Map persistence type to domain entity
 */
export function persistenceToDomain(
  persistence: UserPersistence
): Effect.Effect<UserDomain, Schema.ParseError> {
  return pipe(
    Effect.all({
      id: UserIdVO.fromString(persistence.id),
      email: EmailVO.fromString(persistence.email),
      role: RoleVO.fromString(persistence.role),
      workspaceIds: Effect.all(
        (JSON.parse(persistence.workspaceIds || "[]") as string[]).map((wsId) =>
          WorkspaceIdVO.fromString(wsId)
        )
      ),
      createdAt: DateTimeVO.fromISOString(persistence.createdAt),
      updatedAt: DateTimeVO.fromISOString(persistence.updatedAt),
    }),
    Effect.map(({ id, email, role, workspaceIds, createdAt, updatedAt }) => ({
      id,
      email,
      role,
      workspaceIds,
      isActive: persistence.isActive,
      createdAt,
      updatedAt,
    }))
  );
}

/**
 * Map domain entity to persistence type
 */
export function domainToPersistence(domain: UserDomain): UserPersistence {
  return {
    id: domain.id.toString(),
    email: domain.email.toString(),
    role: domain.role.encode(),
    workspaceIds: JSON.stringify(domain.workspaceIds.map((wsId) => wsId.toString())),
    isActive: domain.isActive,
    createdAt: domain.createdAt.encode(),
    updatedAt: domain.updatedAt.encode(),
  };
}
