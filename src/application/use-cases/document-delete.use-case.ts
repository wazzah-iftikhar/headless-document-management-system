import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import type { UseCaseError } from "../errors/use-case.errors";
import type { DeleteDocumentCommand, DocumentResult } from "../dtos/document.dtos";
import { DeleteDocumentCommandSchema } from "../dtos/document.dtos";
import type { IDocumentRepository } from "../ports/document.repository.port";
import { persistenceToDomain } from "../../infrastructure/mappers/document.mapper";
import type { DocumentDomain } from "../../domain/document/document.entity.schema";
import { DatabaseService } from "../../effect/services/database.service";
import { FileSystemService } from "../../effect/services/filesystem.service";
import { RBACService, type UserContext } from "../services/rbac.service";
import { PermissionAction } from "../../domain/access-policy/value-objects/permission-action.vo";
import { logger } from "../../utils/logger";
import { AuditService, type AuditUserContext } from "../services/audit.service";

/**
 * Delete Document Use Case
 * 
 * Orchestrates document deletion including file removal.
 * 
 * Business Workflow:
 * 1. Validate command input
 * 2. Fetch document to get file path
 * 3. Delete file from disk
 * 4. Delete document from repository
 * 5. Return deleted document info
 * 
 * Transaction Boundary:
 * Multiple operations (delete file + delete document).
 * File deletion failure is logged but doesn't fail the operation.
 * 
 * Dependency Injection:
 * Repositories and services are injected via constructor, following hexagonal architecture.
 */
export class DeleteDocumentUseCase {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly rbacService: RBACService,
    private readonly auditService: AuditService
  ) {}

  execute(
    command: DeleteDocumentCommand,
    userContext: UserContext
  ): Effect.Effect<DocumentResult, UseCaseError, DatabaseService | FileSystemService> {
    return pipe(
      // Step 1: Validate command
      Schema.decodeUnknown(DeleteDocumentCommandSchema)(command),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "command",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Check permission (DELETE access required)
      Effect.flatMap((validatedCommand) =>
        pipe(
          this.rbacService.checkPermission(
            userContext,
            validatedCommand.documentId,
            PermissionAction.DELETE
          ),
          // Step 3: Fetch document to get file path
          Effect.flatMap(() =>
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
                  operation: "DeleteDocument",
                  message: `Repository error: ${repoError._tag}`,
                } as UseCaseError;
              }),
              // Step 4: Convert to domain to get file path
              Effect.flatMap((persistence) => persistenceToDomain(persistence)),
              // Step 5: Delete file from disk (non-critical - log warning if fails)
              Effect.flatMap((domain) =>
                pipe(
                  FileSystemService,
                  Effect.flatMap((fs) =>
                    Effect.tryPromise({
                      try: () => fs.delete(domain.fileReference.filePath),
                      catch: (error) => error as Error,
                    })
                  ),
              Effect.catchAll((error) => {
                logger.warn("File deletion warning", {
                  error: error instanceof Error ? error.message : String(error),
                  documentId: validatedCommand.documentId,
                  operation: "DeleteDocument",
                });
                return Effect.succeed(undefined);
              }),
                  // Step 6: Delete document from repository
                  Effect.flatMap(() =>
                    pipe(
                      this.documentRepo.delete(validatedCommand.documentId),
                      Effect.mapError((repoError) => ({
                        _tag: "UseCaseUnknown",
                        operation: "DeleteDocument",
                        message: `Failed to delete document: ${repoError._tag}`,
                      } as UseCaseError)),
                      // Step 7: Record audit log
                      Effect.flatMap(() =>
                        pipe(
                          this.auditService.record(
                            "DOCUMENT_DELETED",
                            userContext as AuditUserContext,
                            validatedCommand.documentId,
                            {
                              filename: domain.fileReference.filename,
                              originalFilename: domain.fileReference.originalFilename,
                              fileSize: domain.fileSize,
                            }
                          ),
                          Effect.catchAll((error) => {
                            // Log audit failure but don't fail the operation
                            logger.warn("Failed to record audit log", {
                              error: error.message || String(error),
                              operation: "DeleteDocument",
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
