import { Effect, pipe } from "effect";
import type { AccessPolicyDomain, AccessPolicyPersistence } from "../../domain/access-policy/access-policy.entity.schema";
import { Schema } from "@effect/schema";
import {
  PolicyIdVO,
  SubjectTypeVO,
  SubjectIdVO,
  ResourceTypeVO,
  ResourceIdVO,
  PermissionActionVO,
} from "../../domain/access-policy/value-objects";
import { DateTimeVO } from "../../domain/document/value-objects/date-time.vo";

/**
 * AccessPolicy Mapper
 * 
 * Maps between domain entities (AccessPolicyDomain) and persistence types (AccessPolicyPersistence).
 * Handles encoding/decoding of value objects to/from their persistence representations.
 */

/**
 * Map persistence type to domain entity
 */
export function persistenceToDomain(
  persistence: AccessPolicyPersistence
): Effect.Effect<AccessPolicyDomain, Schema.ParseError> {
  return pipe(
    Effect.all({
      id: PolicyIdVO.fromString(persistence.id),
      subjectType: SubjectTypeVO.fromString(persistence.subjectType),
      subjectId: SubjectIdVO.fromString(persistence.subjectId),
      resourceType: ResourceTypeVO.fromString(persistence.resourceType),
      resourceId: persistence.resourceId !== null && persistence.resourceId !== undefined
        ? ResourceIdVO.fromString(persistence.resourceId)
        : Effect.succeed(ResourceIdVO.forAll()),
      actions: Effect.all(
        (JSON.parse(persistence.actions || "[]") as string[]).map((action) =>
          PermissionActionVO.fromString(action)
        )
      ),
      createdAt: DateTimeVO.fromISOString(persistence.createdAt),
      updatedAt: DateTimeVO.fromISOString(persistence.updatedAt),
    }),
    Effect.map(({ id, subjectType, subjectId, resourceType, resourceId, actions, createdAt, updatedAt }) => ({
      id,
      subjectType,
      subjectId,
      resourceType,
      resourceId,
      actions,
      isActive: persistence.isActive,
      createdAt,
      updatedAt,
    }))
  );
}

/**
 * Map domain entity to persistence type
 */
export function domainToPersistence(domain: AccessPolicyDomain): AccessPolicyPersistence {
  return {
    id: domain.id.toString(),
    subjectType: domain.subjectType.encode(),
    subjectId: domain.subjectId.encode(),
    resourceType: domain.resourceType.encode(),
    resourceId: domain.resourceId?.encode() ?? null,
    actions: JSON.stringify(domain.actions.map((action) => action.encode())),
    isActive: domain.isActive,
    createdAt: domain.createdAt.encode(),
    updatedAt: domain.updatedAt.encode(),
  };
}
