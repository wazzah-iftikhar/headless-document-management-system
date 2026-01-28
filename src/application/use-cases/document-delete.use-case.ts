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
    private readonly documentRepo: IDocumentRepository
  ) {}

  execute(
    command: DeleteDocumentCommand
  ): Effect.Effect<DocumentResult, UseCaseError, DatabaseService | FileSystemService> {
    return pipe(
      // Step 1: Validate command
      Schema.decodeUnknown(DeleteDocumentCommandSchema)(command),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "command",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Fetch document to get file path
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
              operation: "DeleteDocument",
              message: `Repository error: ${repoError._tag}`,
            } as UseCaseError;
          }),
          // Step 3: Convert to domain to get file path
          Effect.flatMap((persistence) => persistenceToDomain(persistence)),
          // Step 4: Delete file from disk (non-critical - log warning if fails)
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
                console.warn("File deletion warning:", error);
                return Effect.succeed(undefined);
              }),
              // Step 5: Delete document from repository
              Effect.flatMap(() =>
                pipe(
                  this.documentRepo.delete(validatedCommand.documentId),
                  Effect.mapError((repoError) => ({
                    _tag: "UseCaseUnknown",
                    operation: "DeleteDocument",
                    message: `Failed to delete document: ${repoError._tag}`,
                  } as UseCaseError)),
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
