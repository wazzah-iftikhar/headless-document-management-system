import { AccessLevel, PermissionAction, PermissionActionAccessLevel } from "./value-objects/permission-action.vo";

/**
 * Permission Action Types
 * 
 * Defines permission action types organized by access levels.
 * This provides a clear hierarchy and structure for permission management.
 */

/**
 * Access Level Definitions
 * 
 * Each level includes all permissions from lower levels:
 * - Level 0 (NONE): No access
 * - Level 1 (READ): Can view documents
 * - Level 2 (WRITE): Can create and modify documents (includes READ)
 * - Level 3 (DELETE): Can remove documents (includes READ, WRITE)
 * - Level 4 (SHARE): Can share documents and manage access (includes READ, WRITE, DELETE)
 * - Level 5 (MANAGE): Full management access (includes all permissions)
 */
export const AccessLevelDefinitions = {
  [AccessLevel.NONE]: {
    level: AccessLevel.NONE,
    name: "None",
    description: "No access",
    actions: [] as PermissionAction[],
  },
  [AccessLevel.READ]: {
    level: AccessLevel.READ,
    name: "Read",
    description: "Can view documents",
    actions: [PermissionAction.READ],
  },
  [AccessLevel.WRITE]: {
    level: AccessLevel.WRITE,
    name: "Write",
    description: "Can create and modify documents",
    actions: [PermissionAction.READ, PermissionAction.WRITE],
  },
  [AccessLevel.DELETE]: {
    level: AccessLevel.DELETE,
    name: "Delete",
    description: "Can remove documents",
    actions: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE],
  },
  [AccessLevel.SHARE]: {
    level: AccessLevel.SHARE,
    name: "Share",
    description: "Can share documents and manage access",
    actions: [
      PermissionAction.READ,
      PermissionAction.WRITE,
      PermissionAction.DELETE,
      PermissionAction.SHARE,
    ],
  },
  [AccessLevel.MANAGE]: {
    level: AccessLevel.MANAGE,
    name: "Manage",
    description: "Full management access",
    actions: [
      PermissionAction.READ,
      PermissionAction.WRITE,
      PermissionAction.DELETE,
      PermissionAction.SHARE,
      PermissionAction.MANAGE,
    ],
  },
} as const;

/**
 * Permission Action Type Definitions
 * 
 * Defines each permission action with its access level and description
 */
export const PermissionActionTypes = {
  [PermissionAction.READ]: {
    action: PermissionAction.READ,
    accessLevel: PermissionActionAccessLevel[PermissionAction.READ],
    description: "View and read documents",
    includes: [PermissionAction.READ],
  },
  [PermissionAction.WRITE]: {
    action: PermissionAction.WRITE,
    accessLevel: PermissionActionAccessLevel[PermissionAction.WRITE],
    description: "Create and modify documents",
    includes: [PermissionAction.READ, PermissionAction.WRITE],
  },
  [PermissionAction.DELETE]: {
    action: PermissionAction.DELETE,
    accessLevel: PermissionActionAccessLevel[PermissionAction.DELETE],
    description: "Remove documents",
    includes: [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE],
  },
  [PermissionAction.SHARE]: {
    action: PermissionAction.SHARE,
    accessLevel: PermissionActionAccessLevel[PermissionAction.SHARE],
    description: "Share documents and manage access policies",
    includes: [
      PermissionAction.READ,
      PermissionAction.WRITE,
      PermissionAction.DELETE,
      PermissionAction.SHARE,
    ],
  },
  [PermissionAction.MANAGE]: {
    action: PermissionAction.MANAGE,
    accessLevel: PermissionActionAccessLevel[PermissionAction.MANAGE],
    description: "Full management access including all permissions",
    includes: [
      PermissionAction.READ,
      PermissionAction.WRITE,
      PermissionAction.DELETE,
      PermissionAction.SHARE,
      PermissionAction.MANAGE,
    ],
  },
} as const;

/**
 * Helper: Get all actions for a given access level
 */
export const getActionsForLevel = (level: AccessLevel): PermissionAction[] => {
  return AccessLevelDefinitions[level]?.actions ?? [];
};

/**
 * Helper: Get access level for a permission action
 */
export const getLevelForAction = (action: PermissionAction): AccessLevel => {
  return PermissionActionAccessLevel[action];
};

/**
 * Helper: Check if an access level includes a specific action
 */
export const levelIncludesAction = (
  level: AccessLevel,
  action: PermissionAction
): boolean => {
  const levelActions = getActionsForLevel(level);
  return levelActions.includes(action);
};

/**
 * Helper: Get the minimum access level required for a set of actions
 */
export const getMinimumLevelForActions = (
  actions: PermissionAction[]
): AccessLevel => {
  if (actions.length === 0) return AccessLevel.NONE;
  
  const levels = actions.map((action) => getLevelForAction(action));
  return Math.max(...levels) as AccessLevel;
};
