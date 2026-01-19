import { Effect, pipe } from "effect";
import type { UserDomain } from "../user/user.entity.schema";
import type { AccessPolicyDomain } from "../access-policy/access-policy.entity.schema";
import type { DocumentDomain } from "../document/document.entity.schema";
import { PermissionAction, PermissionActionAccessLevel, AccessLevel } from "../access-policy/value-objects/permission-action.vo";
import { SubjectType } from "../access-policy/value-objects/subject-type.vo";
import { ResourceType } from "../access-policy/value-objects/resource-type.vo";
import { UserRole } from "../user/value-objects/role.vo";
import type { DocumentAccessError } from "./document-access.errors";

/**
 * DocumentAccessService
 * 
 * Domain service for evaluating document access permissions.
 * 
 * This is a pure domain service that:
 * - Takes User, AccessPolicy[], and Document as input
 * - Returns boolean indicating if user has the given permission
 * - Stays in domain layer (pure functions, no IO)
 * - Implements deterministic permission evaluation
 * 
 * Precedence order:
 * 1. Admin - Admins have all permissions (highest priority)
 * 2. Explicit subject policy - Policies targeting the specific user
 * 3. Role policy - Policies targeting the user's role
 * 4. Workspace policy - Policies targeting the user's workspaces
 * 5. Default deny - No access if no policy matches
 */
export class DocumentAccessService {
  /**
   * Evaluate if a user has a specific permission on a document
   * 
   * @param user - The user requesting access
   * @param policies - Array of access policies to evaluate
   * @param document - The document being accessed
   * @param requestedAction - The permission action being requested
   * @returns Effect<boolean, DocumentAccessError> - true if user has permission, false otherwise
   */
  static evaluatePermission(
    user: UserDomain,
    policies: AccessPolicyDomain[],
    document: DocumentDomain,
    requestedAction: PermissionAction
  ): Effect.Effect<boolean, DocumentAccessError> {
    return pipe(
      Effect.succeed(user),
      Effect.flatMap((u) => this.validateUser(u)),
      Effect.flatMap(() =>
        Effect.succeed(
          this.evaluatePermissionInternal(user, policies, document, requestedAction)
        )
      )
    );
  }

  /**
   * Internal permission evaluation logic
   * Implements the precedence order
   */
  private static evaluatePermissionInternal(
    user: UserDomain,
    policies: AccessPolicyDomain[],
    document: DocumentDomain,
    requestedAction: PermissionAction
  ): boolean {
    // Step 1: Check if user is admin (highest precedence)
    if (this.isAdmin(user)) {
      return true;
    }

    // Filter only active policies for documents
    const activeDocumentPolicies = policies.filter(
      (policy) =>
        policy.isActive &&
        policy.resourceType === ResourceType.DOCUMENT &&
        this.matchesResource(policy, document)
    );

    // Step 2: Check explicit subject policy (user-specific)
    const explicitUserPolicy = this.findExplicitUserPolicy(
      activeDocumentPolicies,
      user.id
    );
    if (explicitUserPolicy) {
      return this.policyAllowsAction(explicitUserPolicy, requestedAction);
    }

    // Step 3: Check role policy
    const rolePolicy = this.findRolePolicy(activeDocumentPolicies, user.role);
    if (rolePolicy) {
      return this.policyAllowsAction(rolePolicy, requestedAction);
    }

    // Step 4: Check workspace policies
    const workspacePolicy = this.findWorkspacePolicy(
      activeDocumentPolicies,
      user.workspaceIds
    );
    if (workspacePolicy) {
      return this.policyAllowsAction(workspacePolicy, requestedAction);
    }

    // Step 5: Default deny
    return false;
  }

  /**
   * Validate user is active and valid
   */
  private static validateUser(
    user: UserDomain
  ): Effect.Effect<UserDomain, DocumentAccessError> {
    if (!user.isActive) {
      return Effect.fail({
        _tag: "UserNotActive",
        userId: user.id,
      });
    }
    return Effect.succeed(user);
  }

  /**
   * Check if user is admin
   */
  private static isAdmin(user: UserDomain): boolean {
    return user.role === UserRole.ADMIN;
  }

  /**
   * Check if policy matches the document resource
   */
  private static matchesResource(
    policy: AccessPolicyDomain,
    document: DocumentDomain
  ): boolean {
    // If policy has no specific resourceId (null), it applies to all documents
    if (!policy.resourceId || policy.resourceId === null) {
      return true;
    }
    // Otherwise, check if policy resourceId matches document id
    return policy.resourceId === document.id;
  }

  /**
   * Find explicit user policy (subjectType: "user", subjectId: userId)
   */
  private static findExplicitUserPolicy(
    policies: AccessPolicyDomain[],
    userId: string
  ): AccessPolicyDomain | undefined {
    return policies.find(
      (policy) =>
        policy.subjectType === SubjectType.USER &&
        policy.subjectId === userId
    );
  }

  /**
   * Find role policy (subjectType: "role", subjectId: role)
   */
  private static findRolePolicy(
    policies: AccessPolicyDomain[],
    role: string
  ): AccessPolicyDomain | undefined {
    return policies.find(
      (policy) =>
        policy.subjectType === SubjectType.ROLE &&
        policy.subjectId.toLowerCase() === role.toLowerCase()
    );
  }

  /**
   * Find workspace policy (subjectType: "workspace", subjectId in user's workspaces)
   */
  private static findWorkspacePolicy(
    policies: AccessPolicyDomain[],
    userWorkspaceIds: string[]
  ): AccessPolicyDomain | undefined {
    return policies.find(
      (policy) =>
        policy.subjectType === SubjectType.WORKSPACE &&
        userWorkspaceIds.includes(policy.subjectId)
    );
  }

  /**
   * Check if policy allows the requested action
   * Uses PermissionActionVO to check if action is included
   */
  private static policyAllowsAction(
    policy: AccessPolicyDomain,
    requestedAction: PermissionAction
  ): boolean {
    // Check if the requested action is in the policy's actions array
    const hasExactAction = policy.actions.includes(requestedAction);

    if (hasExactAction) {
      return true;
    }

    // Check if any action in the policy includes the requested action
    // (e.g., MANAGE includes all lower-level actions)
    // We use the access level comparison directly for efficiency
    const requestedLevel = this.getAccessLevelForAction(requestedAction);
    
    return policy.actions.some((action) => {
      const actionLevel = this.getAccessLevelForAction(action);
      // Higher level actions include lower level actions
      return actionLevel >= requestedLevel;
    });
  }

  /**
   * Get access level for a permission action
   */
  private static getAccessLevelForAction(action: PermissionAction): AccessLevel {
    return PermissionActionAccessLevel[action];
  }

  /**
   * Evaluate multiple permissions at once
   * Returns a map of action -> hasPermission
   */
  static evaluateMultiplePermissions(
    user: UserDomain,
    policies: AccessPolicyDomain[],
    document: DocumentDomain,
    requestedActions: PermissionAction[]
  ): Effect.Effect<Record<PermissionAction, boolean>, DocumentAccessError> {
    return pipe(
      Effect.all(
        requestedActions.map((action) =>
          pipe(
            this.evaluatePermission(user, policies, document, action),
            Effect.map((hasPermission) => [action, hasPermission] as const)
          )
        )
      ),
      Effect.map((results) => {
        const resultMap: Partial<Record<PermissionAction, boolean>> = {};
        results.forEach(([action, hasPermission]) => {
          resultMap[action] = hasPermission;
        });
        return resultMap as Record<PermissionAction, boolean>;
      })
    );
  }

  /**
   * Get all allowed actions for a user on a document
   */
  static getAllowedActions(
    user: UserDomain,
    policies: AccessPolicyDomain[],
    document: DocumentDomain
  ): Effect.Effect<PermissionAction[], DocumentAccessError> {
    const allActions = [
      PermissionAction.READ,
      PermissionAction.WRITE,
      PermissionAction.DELETE,
      PermissionAction.SHARE,
      PermissionAction.MANAGE,
    ];

    return pipe(
      this.evaluateMultiplePermissions(user, policies, document, allActions),
      Effect.map((permissions) =>
        allActions.filter((action) => permissions[action] === true)
      )
    );
  }
}
