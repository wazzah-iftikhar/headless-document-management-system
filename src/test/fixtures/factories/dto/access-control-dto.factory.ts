/**
 * Access Control DTO Factory
 * 
 * Creates test instances of access control-related DTOs.
 */

import type {
  ManageAccessPolicyCommand,
  CheckPermissionQuery,
  PermissionCheckResult,
} from "../../../application/dtos/document.dtos";
import { generateTestUuid } from "../../utils";

// ============================================================================
// Command DTOs
// ============================================================================

export interface ManageAccessPolicyCommandOptions {
  documentId?: string;
  subjectType?: "user" | "role" | "workspace";
  subjectId?: string;
  actions?: string[];
  isActive?: boolean;
  index?: number;
}

export function createManageAccessPolicyCommand(
  options: ManageAccessPolicyCommandOptions = {}
): ManageAccessPolicyCommand {
  const index = options.index ?? 0;
  
  return {
    documentId: options.documentId ?? generateTestUuid(index),
    subjectType: options.subjectType ?? "user",
    subjectId: options.subjectId ?? generateTestUuid(index + 1000),
    actions: options.actions ?? ["read"],
    isActive: options.isActive ?? true,
  };
}

// ============================================================================
// Query DTOs
// ============================================================================

export interface CheckPermissionQueryOptions {
  userId?: string;
  documentId?: string;
  action?: "read" | "write" | "delete" | "share" | "manage";
  index?: number;
}

export function createCheckPermissionQuery(
  options: CheckPermissionQueryOptions = {}
): CheckPermissionQuery {
  const index = options.index ?? 0;
  
  return {
    userId: options.userId ?? generateTestUuid(index),
    documentId: options.documentId ?? generateTestUuid(index + 2000),
    action: options.action ?? "read",
  };
}

// ============================================================================
// Result DTOs
// ============================================================================

export interface PermissionCheckResultOptions {
  allowed?: boolean;
  reason?: string;
}

export function createPermissionCheckResult(
  options: PermissionCheckResultOptions = {}
): PermissionCheckResult {
  return {
    allowed: options.allowed ?? true,
    reason: options.reason,
  };
}
