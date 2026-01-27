/**
 * User Persistence Factory
 * 
 * Creates test instances of user persistence models for database operations.
 */

import type { UserPersistence } from "../../../domain/user/user.entity.schema";
import { generateTestUuid, generateTestDate } from "../../utils";

export interface UserPersistenceFactoryOptions {
  id?: string;
  email?: string;
  role?: string;
  workspaceIds?: string | string[]; // Can be JSON string or array
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  index?: number;
}

/**
 * Create a UserPersistence model with test data
 */
export function createUserPersistence(
  options: UserPersistenceFactoryOptions = {}
): UserPersistence {
  const index = options.index ?? 0;
  const id = options.id ?? generateTestUuid(index);
  const now = generateTestDate(index).toISOString();
  
  // Handle workspaceIds - convert array to JSON string if needed
  let workspaceIds: string;
  if (Array.isArray(options.workspaceIds)) {
    workspaceIds = JSON.stringify(options.workspaceIds);
  } else if (options.workspaceIds !== undefined) {
    workspaceIds = options.workspaceIds;
  } else {
    workspaceIds = JSON.stringify([generateTestUuid(index + 1000)]);
  }
  
  return {
    id,
    email: options.email ?? `user${index}@example.com`,
    role: options.role ?? "user",
    workspaceIds,
    isActive: options.isActive ?? true,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Create multiple UserPersistence models
 */
export function createUserPersistenceList(
  count: number,
  baseOptions: UserPersistenceFactoryOptions = {}
): UserPersistence[] {
  return Array.from({ length: count }, (_, i) => 
    createUserPersistence({ ...baseOptions, index: i })
  );
}
