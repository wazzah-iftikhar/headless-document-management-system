import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import type { UseCaseError } from "../errors/use-case.errors";
import type {
  CreateDocumentCommand,
  DocumentResult,
} from "../dtos/document.dtos";
import { CreateDocumentCommandSchema } from "../dtos/document.dtos";
import { DocumentRepositoryImpl } from "../../infrastructure/repositories/implementations/document.repository.impl";
import { persistenceToDomain } from "../../infrastructure/mappers/document.mapper";
import type { DocumentDomain } from "../../domain/document/document.entity.schema";
import { DatabaseService } from "../../effect/services/database.service";
import { randomUUID } from "crypto";

/**
 * Create Document Use Case
 * 
 * Orchestrates the creation of a document with metadata only (no file upload).
 * This is a pure application layer use case that:
 * - Accepts a command DTO
 * - Orchestrates domain services and repositories
 * - Returns a result DTO via Effect
 * - Handles errors at the application layer
 * 
 * Business Workflow:
 * 1. Validate command input
 * 2. Generate document ID (UUID)
 * 3. Create document in repository with placeholder file path
 * 4. Convert persistence to domain entity
 * 5. Return document result DTO
 */
export class CreateDocumentUseCase {
  private documentRepo = new DocumentRepositoryImpl();

  /**
   * Execute the create document use case
   * 
   * @param command - Create document command DTO
   * @returns Effect that resolves to DocumentResult or fails with UseCaseError
   */
  execute(
    command: CreateDocumentCommand
  ): Effect.Effect<DocumentResult, UseCaseError, DatabaseService> {
    return pipe(
      // Step 1: Validate command using schema
      Schema.decodeUnknown(CreateDocumentCommandSchema)(command),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "command",
        message: Schema.formatErrors(error.errors).join(", "),
      } as UseCaseError)),
      // Step 2: Generate document ID and create document
      Effect.flatMap((validatedCommand) =>
        pipe(
          // Generate UUID for document
          Effect.succeed(randomUUID()),
          Effect.flatMap((id) =>
            pipe(
              // Step 3: Create document in repository
              // Note: filePath is placeholder, fileSize is 0, checksum is undefined
              // Actual file will be uploaded later via upload workflow
              this.documentRepo.create({
                filename: validatedCommand.filename,
                originalFilename: validatedCommand.originalFilename,
                filePath: `/documents/${id}/${validatedCommand.filename}`, // Placeholder path
                fileSize: 0, // No file yet
                checksum: undefined,
                metadataTags: JSON.stringify(validatedCommand.metadataTags || []),
              }),
              Effect.mapError((repoError) => {
                // Map repository errors to use case errors
                if (repoError._tag === "DocumentNotFound") {
                  return {
                    _tag: "DocumentNotFound",
                    documentId: repoError.documentId,
                  } as UseCaseError;
                }
                return {
                  _tag: "UseCaseUnknown",
                  operation: "CreateDocument",
                  message: `Repository error: ${repoError._tag}`,
                } as UseCaseError;
              }),
              // Step 4: Convert persistence to domain entity
              Effect.flatMap((persistence) => persistenceToDomain(persistence)),
              // Step 5: Map domain entity to result DTO
              Effect.map((domain) => this.domainToResult(domain))
            )
          )
        )
      )
    );
  }

  /**
   * Map domain entity to result DTO
   * 
   * This transforms the rich domain entity (with value objects) into
   * a flat DTO suitable for use case output.
   */
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
