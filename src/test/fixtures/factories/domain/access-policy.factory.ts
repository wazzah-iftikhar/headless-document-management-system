/**
 * AccessPolicy Domain Entity Factory
 * 
 * Creates test instances of AccessPolicyDomain entities with realistic, deterministic data.
 */

import type { AccessPolicyDomain } from "../../../domain/access-policy/access-policy.entity.schema";
import { generateTestUuid, generateTestDate } from "../../utils";

export interface AccessPolicyFactoryOptions {
  id?: string;
  subjectType?: "user" | "role" | "workspace";
  subjectId?: string;
  resourceType?: string;
  resourceId?: string | null;
  actions?: ("read" | "write" | "delete" | "share" | "manage")[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  index?: number; // For deterministic generation
}

/**
 * Create an AccessPolicyDomain entity with test data
 */
export function createAccessPolicyDomain(options: AccessPolicyFactoryOptions = {}): AccessPolicyDomain {
  const index = options.index ?? 0;
  const id = options.id ?? generateTestUuid(index + 2000); // Use different seed range
  const now = generateTestDate(index);
  
  return {
    id,
    subjectType: options.subjectType ?? "user",
    subjectId: options.subjectId ?? generateTestUuid(index + 3000),
    resourceType: options.resourceType ?? "document",
    resourceId: options.resourceId !== undefined ? options.resourceId : generateTestUuid(index + 4000),
    actions: options.actions ?? ["read"],
    isActive: options.isActive ?? true,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Create multiple AccessPolicyDomain entities
 */
export function createAccessPolicyDomains(count: number, baseOptions: AccessPolicyFactoryOptions = {}): AccessPolicyDomain[] {
  return Array.from({ length: count }, (_, i) => 
    createAccessPolicyDomain({ ...baseOptions, index: i })
  );
}

/**
 * Create a user-specific policy
 */
export function createUserPolicy(
  userId: string,
  documentId: string,
  actions: ("read" | "write" | "delete" | "share" | "manage")[] = ["read"]
): AccessPolicyDomain {
  return createAccessPolicyDomain({
    subjectType: "user",
    subjectId: userId,
    resourceId: documentId,
    actions,
  });
}

/**
 * Create a role-based policy
 */
export function createRolePolicy(
  role: string,
  actions: ("read" | "write" | "delete" | "share" | "manage")[] = ["read"]
): AccessPolicyDomain {
  return createAccessPolicyDomain({
    subjectType: "role",
    subjectId: role,
    resourceId: null, // Role policies apply to all resources
    actions,
  });
}

/**
 * Create a workspace policy
 */
export function createWorkspacePolicy(
  workspaceId: string,
  actions: ("read" | "write" | "delete" | "share" | "manage")[] = ["read"]
): AccessPolicyDomain {
  return createAccessPolicyDomain({
    subjectType: "workspace",
    subjectId: workspaceId,
    resourceId: null, // Workspace policies apply to all resources
    actions,
  });
}
