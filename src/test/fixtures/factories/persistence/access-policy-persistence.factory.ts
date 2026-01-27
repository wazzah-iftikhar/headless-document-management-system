/**
 * AccessPolicy Persistence Factory
 * 
 * Creates test instances of access policy persistence models for database operations.
 */

import type { AccessPolicyPersistence } from "../../../domain/access-policy/access-policy.entity.schema";
import { generateTestUuid, generateTestDate } from "../../utils";

export interface AccessPolicyPersistenceFactoryOptions {
  id?: string;
  subjectType?: string;
  subjectId?: string;
  resourceType?: string;
  resourceId?: string | null;
  actions?: string | string[]; // Can be JSON string or array
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  index?: number;
}

/**
 * Create an AccessPolicyPersistence model with test data
 */
export function createAccessPolicyPersistence(
  options: AccessPolicyPersistenceFactoryOptions = {}
): AccessPolicyPersistence {
  const index = options.index ?? 0;
  const id = options.id ?? generateTestUuid(index + 2000);
  const now = generateTestDate(index).toISOString();
  
  // Handle actions - convert array to JSON string if needed
  let actions: string;
  if (Array.isArray(options.actions)) {
    actions = JSON.stringify(options.actions);
  } else if (options.actions !== undefined) {
    actions = options.actions;
  } else {
    actions = JSON.stringify(["read"]);
  }
  
  return {
    id,
    subjectType: options.subjectType ?? "user",
    subjectId: options.subjectId ?? generateTestUuid(index + 3000),
    resourceType: options.resourceType ?? "document",
    resourceId: options.resourceId !== undefined ? options.resourceId : generateTestUuid(index + 4000),
    actions,
    isActive: options.isActive ?? true,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Create multiple AccessPolicyPersistence models
 */
export function createAccessPolicyPersistenceList(
  count: number,
  baseOptions: AccessPolicyPersistenceFactoryOptions = {}
): AccessPolicyPersistence[] {
  return Array.from({ length: count }, (_, i) => 
    createAccessPolicyPersistence({ ...baseOptions, index: i })
  );
}
