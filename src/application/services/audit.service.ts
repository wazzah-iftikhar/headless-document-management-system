/**
 * Audit Service
 * 
 * Service for recording audit logs of critical operations.
 * 
 * Audit logs capture:
 * - Who: User ID and workspace ID
 * - What: Operation type and details
 * - When: Timestamp
 * - Where: Resource ID (document, policy, etc.)
 * - Why: Action taken and reason (if applicable)
 * 
 * Audit logs are immutable and should never be deleted or modified.
 */

import { Effect, pipe } from "effect";
import type { AuditLogEntry, AuditEventType } from "../dtos/audit.dtos";
import { AuditLogEntrySchema } from "../dtos/audit.dtos";
import { Schema } from "@effect/schema";
import type { UseCaseError } from "../errors/use-case.errors";
import type { IAuditLogRepository } from "../ports/audit-log.repository.port";

/**
 * User Context for Audit Logs
 */
export interface AuditUserContext {
  userId: string;
  workspaceId: string;
  email?: string;
  role?: string;
}

/**
 * Audit Service
 * 
 * Records audit logs for critical operations.
 * Audit logs are stored in the database for compliance and debugging.
 */
export class AuditService {
  constructor(
    private readonly auditLogRepository: IAuditLogRepository
  ) {}

  /**
   * Record an audit log entry
   * 
   * @param eventType - Type of event (DOCUMENT_CREATED, DOCUMENT_DELETED, etc.)
   * @param userContext - User context (who performed the action)
   * @param resourceId - Resource ID (document ID, policy ID, etc.)
   * @param details - Additional details about the operation
   * @param correlationId - Correlation ID for request tracking
   */
  record(
    eventType: AuditEventType,
    userContext: AuditUserContext,
    resourceId: string,
    details?: Record<string, unknown>,
    correlationId?: string
  ): Effect.Effect<void, UseCaseError, DatabaseService> {
    const auditEntry: AuditLogEntry = {
      eventType,
      userId: userContext.userId,
      workspaceId: userContext.workspaceId,
      userEmail: userContext.email,
      userRole: userContext.role,
      resourceId,
      resourceType: this.getResourceType(eventType),
      details: details ? JSON.stringify(details) : undefined,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    return pipe(
      // Validate audit entry
      Schema.decodeUnknown(AuditLogEntrySchema)(auditEntry),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "auditEntry",
        message: `Invalid audit entry: ${String(error)}`,
      } as UseCaseError)),
      // Store audit log
      Effect.flatMap((validatedEntry) =>
        pipe(
          this.auditLogRepository.create(validatedEntry),
          Effect.mapError((repoError) => ({
            _tag: "UseCaseUnknown",
            operation: "AuditService.record",
            message: `Failed to record audit log: ${repoError._tag}`,
          } as UseCaseError)),
          Effect.map(() => undefined)
        )
      )
    );
  }

  /**
   * Get resource type from event type
   */
  private getResourceType(eventType: AuditEventType): string {
    if (eventType.startsWith("DOCUMENT_")) {
      return "document";
    }
    if (eventType.startsWith("ACCESS_POLICY_")) {
      return "access_policy";
    }
    if (eventType.startsWith("USER_")) {
      return "user";
    }
    return "unknown";
  }
}

/**
 * Repository Error Types
 */
export type RepositoryError =
  | { _tag: "AuditLogNotFound"; id: string }
  | { _tag: "RepositoryUnknown"; message: string };
