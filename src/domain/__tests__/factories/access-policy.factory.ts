import { Effect } from "effect";
import type { AccessPolicyDomain } from "../../access-policy/access-policy.entity.schema";
import { PolicyIdVO } from "../../access-policy/value-objects/policy-id.vo";
import { SubjectTypeVO, SubjectType } from "../../access-policy/value-objects/subject-type.vo";
import { SubjectIdVO } from "../../access-policy/value-objects/subject-id.vo";
import { ResourceTypeVO, ResourceType } from "../../access-policy/value-objects/resource-type.vo";
import { ResourceIdVO } from "../../access-policy/value-objects/resource-id.vo";
import { PermissionActionVO, PermissionAction } from "../../access-policy/value-objects/permission-action.vo";
import { DateTimeVO } from "../../document/value-objects/date-time.vo";

/**
 * AccessPolicy Test Factory
 * 
 * Provides deterministic test data generation for AccessPolicy entities.
 * All factories use fixed UUIDs and predictable data for reproducible tests.
 */
export class AccessPolicyFactory {
  // Fixed UUIDs for deterministic testing
  private static readonly FIXED_POLICY_ID = "00000000-0000-4000-8000-000000001000";
  private static readonly FIXED_USER_ID = "00000000-0000-4000-8000-000000000001";
  private static readonly FIXED_WORKSPACE_ID = "00000000-0000-4000-8000-000000000010";
  private static readonly FIXED_DOCUMENT_ID = "00000000-0000-4000-8000-000000000100";

  /**
   * Create a default policy with all required fields
   */
  static createDefault(): Effect.Effect<AccessPolicyDomain> {
    return Effect.all([
      PolicyIdVO.fromString(this.FIXED_POLICY_ID),
      Effect.succeed(SubjectTypeVO.user()),
      SubjectIdVO.fromString(this.FIXED_USER_ID),
      Effect.succeed(ResourceTypeVO.document()),
      ResourceIdVO.fromString(null), // Wildcard - applies to all documents
      Effect.succeed(PermissionActionVO.read()),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, subjectType, subjectId, resourceType, resourceId, action, createdAt]) => ({
        id: id.getValue(),
        subjectType: subjectType.getValue(),
        subjectId: subjectId.getValue(),
        resourceType: resourceType.getValue(),
        resourceId: resourceId.getValue(),
        actions: [action.getValue()],
        isActive: true,
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a policy with custom properties
   */
  static create(overrides?: Partial<AccessPolicyDomain>): Effect.Effect<AccessPolicyDomain> {
    return this.createDefault().pipe(
      Effect.map((policy) => ({
        ...policy,
        ...overrides,
        // Ensure actions is always an array
        actions: overrides?.actions ?? policy.actions,
      }))
    );
  }

  /**
   * Create a user-specific policy
   */
  static createForUser(
    userId: string,
    actions: PermissionAction[] = [PermissionAction.READ]
  ): Effect.Effect<AccessPolicyDomain> {
    return Effect.all([
      PolicyIdVO.fromString(this.FIXED_POLICY_ID),
      Effect.succeed(SubjectTypeVO.user()),
      SubjectIdVO.fromString(userId),
      Effect.succeed(ResourceTypeVO.document()),
      ResourceIdVO.fromString(null),
      Effect.all(actions.map((a) => PermissionActionVO.fromString(a))),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, subjectType, subjectId, resourceType, resourceId, actionVOs, createdAt]) => ({
        id: id.getValue(),
        subjectType: subjectType.getValue(),
        subjectId: subjectId.getValue(),
        resourceType: resourceType.getValue(),
        resourceId: resourceId.getValue(),
        actions: actionVOs.map((vo: PermissionActionVO) => vo.getValue()),
        isActive: true,
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a role-based policy
   */
  static createForRole(
    role: string,
    actions: PermissionAction[] = [PermissionAction.READ]
  ): Effect.Effect<AccessPolicyDomain> {
    return Effect.all([
      PolicyIdVO.fromString(this.FIXED_POLICY_ID),
      Effect.succeed(SubjectTypeVO.role()),
      SubjectIdVO.fromString(role),
      Effect.succeed(ResourceTypeVO.document()),
      ResourceIdVO.fromString(null),
      Effect.all(actions.map((a) => PermissionActionVO.fromString(a))),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, subjectType, subjectId, resourceType, resourceId, actionVOs, createdAt]) => ({
        id: id.getValue(),
        subjectType: subjectType.getValue(),
        subjectId: subjectId.getValue(),
        resourceType: resourceType.getValue(),
        resourceId: resourceId.getValue(),
        actions: actionVOs.map((vo: PermissionActionVO) => vo.getValue()),
        isActive: true,
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a workspace-based policy
   */
  static createForWorkspace(
    workspaceId: string,
    actions: PermissionAction[] = [PermissionAction.READ]
  ): Effect.Effect<AccessPolicyDomain> {
    return Effect.all([
      PolicyIdVO.fromString(this.FIXED_POLICY_ID),
      Effect.succeed(SubjectTypeVO.workspace()),
      SubjectIdVO.fromString(workspaceId),
      Effect.succeed(ResourceTypeVO.document()),
      ResourceIdVO.fromString(null),
      Effect.all(actions.map((a) => PermissionActionVO.fromString(a))),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, subjectType, subjectId, resourceType, resourceId, actionVOs, createdAt]) => ({
        id: id.getValue(),
        subjectType: subjectType.getValue(),
        subjectId: subjectId.getValue(),
        resourceType: resourceType.getValue(),
        resourceId: resourceId.getValue(),
        actions: actionVOs.map((vo: PermissionActionVO) => vo.getValue()),
        isActive: true,
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a policy for a specific document
   */
  static createForDocument(
    documentId: string,
    subjectType: SubjectType,
    subjectId: string,
    actions: PermissionAction[] = [PermissionAction.READ]
  ): Effect.Effect<AccessPolicyDomain> {
    return Effect.all([
      PolicyIdVO.fromString(this.FIXED_POLICY_ID),
      SubjectTypeVO.fromString(subjectType),
      SubjectIdVO.fromString(subjectId),
      Effect.succeed(ResourceTypeVO.document()),
      ResourceIdVO.fromString(documentId),
      Effect.all(actions.map((a) => PermissionActionVO.fromString(a))),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, subjectTypeVO, subjectIdVO, resourceType, resourceId, actionVOs, createdAt]) => ({
        id: id.getValue(),
        subjectType: subjectTypeVO.getValue(),
        subjectId: subjectIdVO.getValue(),
        resourceType: resourceType.getValue(),
        resourceId: resourceId.getValue(),
        actions: actionVOs.map((vo: PermissionActionVO) => vo.getValue()),
        isActive: true,
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create an inactive policy
   */
  static createInactive(): Effect.Effect<AccessPolicyDomain> {
    return this.create({ isActive: false });
  }

  /**
   * Create a policy with read permission
   */
  static createReadOnly(): Effect.Effect<AccessPolicyDomain> {
    return this.create({ actions: [PermissionAction.READ] });
  }

  /**
   * Create a policy with write permission
   */
  static createWriteOnly(): Effect.Effect<AccessPolicyDomain> {
    return this.create({ actions: [PermissionAction.WRITE] });
  }

  /**
   * Create a policy with manage permission (includes all)
   */
  static createManage(): Effect.Effect<AccessPolicyDomain> {
    return this.create({ actions: [PermissionAction.MANAGE] });
  }

  /**
   * Create a policy with multiple actions
   */
  static createWithActions(actions: PermissionAction[]): Effect.Effect<AccessPolicyDomain> {
    return this.create({ actions });
  }
}
