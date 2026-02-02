/**
 * Audit Log Repository Port
 * 
 * Interface for storing audit logs.
 * Implementations should ensure audit logs are immutable.
 */

import { Effect } from "effect";
import type { AuditLogEntry } from "../dtos/audit.dtos";
import { DatabaseService } from "../../effect/services/database.service";

export type RepositoryError =
  | { _tag: "AuditLogNotFound"; id: string }
  | { _tag: "RepositoryUnknown"; message: string };

export interface IAuditLogRepository {
  create(entry: AuditLogEntry): Effect.Effect<{ id: string }, RepositoryError, DatabaseService>;
  findByResource(
    resourceType: string,
    resourceId: string,
    options?: { page?: number; limit?: number }
  ): Effect.Effect<{ data: AuditLogEntry[]; count: number }, RepositoryError, DatabaseService>;
  findByUser(
    userId: string,
    options?: { page?: number; limit?: number }
  ): Effect.Effect<{ data: AuditLogEntry[]; count: number }, RepositoryError, DatabaseService>;
}
