/**
 * Audit Log Repository Implementation
 * 
 * Implements the audit log repository port using Drizzle ORM.
 * 
 * Audit logs are immutable - no update or delete operations.
 */

import { Effect, pipe } from "effect";
import { eq, desc, and } from "drizzle-orm";
import { DatabaseService } from "../../../effect/services/database.service";
import type { IAuditLogRepository, RepositoryError } from "../../../application/ports/audit-log.repository.port";
import type { AuditLogEntry } from "../../../application/dtos/audit.dtos";
import { auditLogs } from "../../database/schemas/audit-logs.schema";

/**
 * Audit Log Repository Implementation
 */
export class AuditLogRepositoryImpl implements IAuditLogRepository {
  /**
   * Create a new audit log entry
   * 
   * Audit logs are immutable - once created, they cannot be modified or deleted.
   */
  create(entry: AuditLogEntry): Effect.Effect<{ id: string }, RepositoryError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const result = await db
              .insert(auditLogs)
              .values({
                eventType: entry.eventType,
                userId: entry.userId,
                workspaceId: entry.workspaceId,
                userEmail: entry.userEmail || null,
                userRole: entry.userRole || null,
                resourceId: entry.resourceId,
                resourceType: entry.resourceType,
                details: entry.details || null,
                correlationId: entry.correlationId || null,
                timestamp: entry.timestamp,
              })
              .returning({ id: auditLogs.id });

            if (!result || result.length === 0) {
              throw new Error("Failed to create audit log entry");
            }

            return { id: String(result[0].id) };
          },
          catch: (error) => ({
            _tag: "RepositoryUnknown",
            message: error instanceof Error ? error.message : String(error),
          } as RepositoryError),
        })
      )
    );
  }

  /**
   * Find audit logs by resource
   * 
   * Returns audit logs for a specific resource (document, policy, etc.)
   * Ordered by timestamp descending (most recent first).
   */
  findByResource(
    resourceType: string,
    resourceId: string,
    options?: { page?: number; limit?: number }
  ): Effect.Effect<{ data: AuditLogEntry[]; count: number }, RepositoryError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const page = options?.page || 1;
            const limit = options?.limit || 100;
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await db
              .select({ count: auditLogs.id })
              .from(auditLogs)
              .where(and(eq(auditLogs.resourceType, resourceType), eq(auditLogs.resourceId, resourceId)));

            const totalCount = countResult.length;

            // Get paginated results
            const results = await db
              .select()
              .from(auditLogs)
              .where(and(eq(auditLogs.resourceType, resourceType), eq(auditLogs.resourceId, resourceId)))
              .orderBy(desc(auditLogs.timestamp))
              .limit(limit)
              .offset(offset);

            const data: AuditLogEntry[] = results.map((row) => ({
              eventType: row.eventType,
              userId: row.userId,
              workspaceId: row.workspaceId,
              userEmail: row.userEmail || undefined,
              userRole: row.userRole || undefined,
              resourceId: row.resourceId,
              resourceType: row.resourceType,
              details: row.details || undefined,
              correlationId: row.correlationId || undefined,
              timestamp: row.timestamp,
            }));

            return { data, count: totalCount };
          },
          catch: (error) => ({
            _tag: "RepositoryUnknown",
            message: error instanceof Error ? error.message : String(error),
          } as RepositoryError),
        })
      )
    );
  }

  /**
   * Find audit logs by user
   * 
   * Returns audit logs for a specific user.
   * Ordered by timestamp descending (most recent first).
   */
  findByUser(
    userId: string,
    options?: { page?: number; limit?: number }
  ): Effect.Effect<{ data: AuditLogEntry[]; count: number }, RepositoryError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const page = options?.page || 1;
            const limit = options?.limit || 100;
            const offset = (page - 1) * limit;

            // Get total count
            const countResult = await db
              .select({ count: auditLogs.id })
              .from(auditLogs)
              .where(eq(auditLogs.userId, userId));

            const totalCount = countResult.length;

            // Get paginated results
            const results = await db
              .select()
              .from(auditLogs)
              .where(eq(auditLogs.userId, userId))
              .orderBy(desc(auditLogs.timestamp))
              .limit(limit)
              .offset(offset);

            const data: AuditLogEntry[] = results.map((row) => ({
              eventType: row.eventType,
              userId: row.userId,
              workspaceId: row.workspaceId,
              userEmail: row.userEmail || undefined,
              userRole: row.userRole || undefined,
              resourceId: row.resourceId,
              resourceType: row.resourceType,
              details: row.details || undefined,
              correlationId: row.correlationId || undefined,
              timestamp: row.timestamp,
            }));

            return { data, count: totalCount };
          },
          catch: (error) => ({
            _tag: "RepositoryUnknown",
            message: error instanceof Error ? error.message : String(error),
          } as RepositoryError),
        })
      )
    );
  }
}
