import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import type { UseCaseError } from "../errors/use-case.errors";
import type {
  PublishDocumentCommand,
  UpdateDocumentMetadataCommand,
  DocumentResult,
} from "../dtos/document.dtos";
import {
  PublishDocumentCommandSchema,
  UpdateDocumentMetadataCommandSchema,
} from "../dtos/document.dtos";
import type { IDocumentRepository } from "../ports/document.repository.port";
import { persistenceToDomain } from "../../infrastructure/mappers/document.mapper";
import type { DocumentDomain } from "../../domain/document/document.entity.schema";
import { DatabaseService } from "../../effect/services/database.service";
import { RBACService, type UserContext } from "../services/rbac.service";
import { PermissionAction } from "../../domain/access-policy/value-objects/permission-action.vo";
import { AuditService, type AuditUserContext } from "../services/audit.service";
import { logger } from "../../utils/logger";

/**
 * Publish Document Use Case
 * 
 * Orchestrates document publish status transitions.
 * 
 * Business Workflow:
 * 1. Validate command input
 * 2. Fetch document to check current status
 * 3. Validate status transition (draft -> published -> archived)
 * 4. Update document metadata with new status
 * 5. Return updated document
 * 
 * Status Transitions:
 * - draft -> published (allowed)
 * - published -> archived (allowed)
 * - archived -> draft (not allowed in this implementation)
 * - Any -> same status (idempotent, allowed)
 * 
 * Transaction Boundary:
 * Single repository operation (update document). Atomic by default.
 * 
 * Dependency Injection:
 * Repository is injected via constructor, following hexagonal architecture.
 */
export class PublishDocumentUseCase {
  constructor(private readonly documentRepo: IDocumentRepository) {}

  execute(
    command: PublishDocumentCommand
  ): Effect.Effect<DocumentResult, UseCaseError, DatabaseService> {
    return pipe(
      // Step 1: Validate command
      Schema.decodeUnknown(PublishDocumentCommandSchema)(command),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "command",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Fetch document to check current status
      Effect.flatMap((validatedCommand) =>
        pipe(
          this.documentRepo.findById(validatedCommand.documentId),
          Effect.mapError((repoError) => {
            if (repoError._tag === "DocumentNotFound") {
              return {
                _tag: "DocumentNotFound",
                documentId: repoError.documentId,
              } as UseCaseError;
            }
            return {
              _tag: "UseCaseUnknown",
              operation: "PublishDocument",
              message: `Repository error: ${repoError._tag}`,
            } as UseCaseError;
          }),
          // Step 3: Validate status transition
          Effect.flatMap((persistence) =>
            pipe(
              persistenceToDomain(persistence),
              Effect.flatMap((domain) => {
                // Extract current status from metadata tags
                const currentStatus = this.extractStatusFromTags([...domain.metadataTags]);
                
                // Validate transition
                if (!this.isValidTransition(currentStatus, validatedCommand.status)) {
                  return Effect.fail({
                    _tag: "InvalidStatusTransition",
                    from: currentStatus || "unknown",
                    to: validatedCommand.status,
                  } as UseCaseError);
                }

                return Effect.succeed({ domain, validatedCommand });
              })
            )
          ),
          // Step 4: Update document with new status
          Effect.flatMap(({ domain, validatedCommand }) =>
            pipe(
              // Update metadata tags to include new status
              // Remove old status tag and add new one
              this.documentRepo.update(validatedCommand.documentId, {
                metadataTags: JSON.stringify(
                  this.updateStatusInTags([...domain.metadataTags], validatedCommand.status)
                ),
              }),
              Effect.mapError((repoError) => ({
                _tag: "UseCaseUnknown",
                operation: "PublishDocument",
                message: `Failed to update document: ${repoError._tag}`,
              } as UseCaseError)),
              // Step 5: Convert to result
              Effect.flatMap((updatedPersistence) => persistenceToDomain(updatedPersistence)),
              Effect.map((domain) => this.domainToResult(domain))
            )
          )
        )
      )
    );
  }

  /**
   * Extract status from metadata tags
   */
  private extractStatusFromTags(tags: string[]): string | null {
    const statusTag = tags.find((tag) => tag.startsWith("status:"));
    return statusTag ? statusTag.replace("status:", "") : null;
  }

  /**
   * Update status in metadata tags
   */
  private updateStatusInTags(tags: string[], newStatus: string): string[] {
    // Remove old status tags
    const filteredTags = tags.filter((tag) => !tag.startsWith("status:"));
    // Add new status tag
    return [...filteredTags, `status:${newStatus}`];
  }

  /**
   * Validate status transition
   */
  private isValidTransition(from: string | null, to: string): boolean {
    // Same status is always valid (idempotent)
    if (from === to) {
      return true;
    }

    // No current status means draft (default)
    const currentStatus = from || "draft";

    // Allowed transitions
    const allowedTransitions: Record<string, string[]> = {
      draft: ["published"],
      published: ["archived"],
      archived: [], // Cannot transition from archived
    };

    return allowedTransitions[currentStatus]?.includes(to) ?? false;
  }

  private domainToResult(domain: DocumentDomain): DocumentResult {
    return {
      id: domain.id,
      filename: domain.fileReference.filename,
      originalFilename: domain.fileReference.originalFilename,
      filePath: domain.fileReference.filePath,
      fileSize: domain.fileSize,
      checksum: domain.checksum,
      metadataTags: domain.metadataTags,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

/**
 * Update Document Metadata Use Case
 * 
 * Updates document metadata (tags, etc.) without changing the file.
 * 
 * Business Workflow:
 * 1. Validate command input
 * 2. Update document metadata
 * 3. Return updated document
 * 
 * Transaction Boundary:
 * Single repository operation (update document). Atomic by default.
 * 
 * Dependency Injection:
 * Repository is injected via constructor, following hexagonal architecture.
 */
export class UpdateDocumentMetadataUseCase {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly rbacService: RBACService,
    private readonly auditService: AuditService
  ) {}

  execute(
    command: UpdateDocumentMetadataCommand,
    userContext: UserContext
  ): Effect.Effect<DocumentResult, UseCaseError, DatabaseService> {
    return pipe(
      // Step 1: Validate command
      Schema.decodeUnknown(UpdateDocumentMetadataCommandSchema)(command),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "command",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Check permission (WRITE access required)
      Effect.flatMap((validatedCommand) =>
        pipe(
          this.rbacService.checkPermission(
            userContext,
            validatedCommand.documentId,
            PermissionAction.WRITE
          ),
          // Step 3: Update document metadata
          Effect.flatMap(() =>
            pipe(
              this.documentRepo.update(validatedCommand.documentId, {
                metadataTags: validatedCommand.metadataTags
                  ? JSON.stringify(validatedCommand.metadataTags)
                  : undefined,
              }),
              Effect.mapError((repoError) => {
                if (repoError._tag === "DocumentNotFound") {
                  return {
                    _tag: "DocumentNotFound",
                    documentId: repoError.documentId,
                  } as UseCaseError;
                }
                return {
                  _tag: "UseCaseUnknown",
                  operation: "UpdateDocumentMetadata",
                  message: `Repository error: ${repoError._tag}`,
                } as UseCaseError;
              }),
              // Step 4: Convert to result
              Effect.flatMap((persistence) => persistenceToDomain(persistence)),
              // Step 5: Record audit log
              Effect.flatMap((domain) =>
                pipe(
                  this.auditService.record(
                    "DOCUMENT_UPDATED",
                    userContext as AuditUserContext,
                    validatedCommand.documentId,
                    {
                      metadataTags: validatedCommand.metadataTags,
                      filename: domain.fileReference.filename,
                    }
                  ),
                  Effect.catchAll((error) => {
                    // Log audit failure but don't fail the operation
                    logger.warn("Failed to record audit log", {
                      error: error.message || String(error),
                      operation: "UpdateDocumentMetadata",
                      documentId: validatedCommand.documentId,
                    });
                    return Effect.succeed(undefined);
                  }),
                  Effect.map(() => this.domainToResult(domain))
                )
              )
            )
          )
        )
      )
    );
  }

  private domainToResult(domain: DocumentDomain): DocumentResult {
    return {
      id: domain.id,
      filename: domain.fileReference.filename,
      originalFilename: domain.fileReference.originalFilename,
      filePath: domain.fileReference.filePath,
      fileSize: domain.fileSize,
      checksum: domain.checksum,
      metadataTags: domain.metadataTags,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
