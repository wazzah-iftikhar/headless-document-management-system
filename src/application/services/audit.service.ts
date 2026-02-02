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
   * @param details - Additional details about the operation (will be sanitized)
   * @param correlationId - Correlation ID for request tracking
   * 
   * Note: Details are sanitized to ensure no sensitive data (passwords, tokens, etc.) is stored.
   */
  record(
    eventType: AuditEventType,
    userContext: AuditUserContext,
    resourceId: string,
    details?: Record<string, unknown>,
    correlationId?: string
  ): Effect.Effect<void, UseCaseError, DatabaseService> {
    // Sanitize details to remove sensitive information
    const sanitizedDetails = details ? this.sanitizeDetails(details) : undefined;
    const auditEntry: AuditLogEntry = {
      eventType,
      userId: userContext.userId,
      workspaceId: userContext.workspaceId,
      userEmail: userContext.email,
      userRole: userContext.role,
      resourceId,
      resourceType: this.getResourceType(eventType),
      details: sanitizedDetails ? JSON.stringify(sanitizedDetails) : undefined,
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

  /**
   * Sanitize audit log details to remove sensitive information
   * 
   * Removes passwords, tokens, secrets, and other sensitive data.
   */
  private sanitizeDetails(details: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = [
      "password",
      "secret",
      "token",
      "key",
      "credential",
      "apiKey",
      "accessToken",
      "refreshToken",
      "authorization",
    ];

    for (const [key, value] of Object.entries(details)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        // Replace sensitive values with [REDACTED]
        sanitized[key] = "[REDACTED]";
      } else if (typeof value === "string" && this.containsSensitivePattern(value)) {
        // Check if value contains sensitive patterns
        sanitized[key] = this.sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if string contains sensitive patterns
   */
  private containsSensitivePattern(value: string): boolean {
    // Check for JWT tokens, API keys, etc.
    const sensitivePatterns = [
      /^Bearer\s+/i,
      /^[A-Za-z0-9_-]{20,}$/, // Long tokens/keys
      /password/i,
      /secret/i,
    ];

    return sensitivePatterns.some((pattern) => pattern.test(value));
  }

  /**
   * Sanitize string value
   */
  private sanitizeString(value: string): string {
    // Remove file paths
    value = value.replace(/\/[^\s]+/g, "[path]");
    // Remove absolute paths
    value = value.replace(/[A-Z]:\\[^\s]+/g, "[path]");
    // Remove tokens
    value = value.replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]");
    return value;
  }
}

/**
 * Repository Error Types
 */
export type RepositoryError =
  | { _tag: "AuditLogNotFound"; id: string }
  | { _tag: "RepositoryUnknown"; message: string };
