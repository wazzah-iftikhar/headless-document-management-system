/**
 * User Domain Entity Factory
 * 
 * Creates test instances of UserDomain entities with realistic, deterministic data.
 */

import type { UserDomain } from "../../../domain/user/user.entity.schema";
import { generateTestUuid, generateTestDate } from "../../utils";

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  role?: "admin" | "user" | "viewer";
  workspaceIds?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  index?: number; // For deterministic generation
}

/**
 * Create a UserDomain entity with test data
 */
export function createUserDomain(options: UserFactoryOptions = {}): UserDomain {
  const index = options.index ?? 0;
  const id = options.id ?? generateTestUuid(index);
  const now = generateTestDate(index);
  
  return {
    id,
    email: options.email ?? `user${index}@example.com`,
    role: options.role ?? "user",
    workspaceIds: options.workspaceIds ?? [generateTestUuid(index + 1000)], // Use different seed range
    isActive: options.isActive ?? true,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Create multiple UserDomain entities
 */
export function createUserDomains(count: number, baseOptions: UserFactoryOptions = {}): UserDomain[] {
  return Array.from({ length: count }, (_, i) => 
    createUserDomain({ ...baseOptions, index: i })
  );
}

/**
 * Create an admin user
 */
export function createAdminUser(options: Omit<UserFactoryOptions, "role"> = {}): UserDomain {
  return createUserDomain({ ...options, role: "admin" });
}

/**
 * Create a regular user
 */
export function createRegularUser(options: Omit<UserFactoryOptions, "role"> = {}): UserDomain {
  return createUserDomain({ ...options, role: "user" });
}

/**
 * Create a viewer user
 */
export function createViewerUser(options: Omit<UserFactoryOptions, "role"> = {}): UserDomain {
  return createUserDomain({ ...options, role: "viewer" });
}

/**
 * Create an inactive user
 */
export function createInactiveUser(options: Omit<UserFactoryOptions, "isActive"> = {}): UserDomain {
  return createUserDomain({ ...options, isActive: false });
}
