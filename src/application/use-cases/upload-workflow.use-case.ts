import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import type { UseCaseError } from "../errors/use-case.errors";
import type {
  InitiateUploadCommand,
  ConfirmUploadCommand,
  UploadInitiationResult,
  UploadConfirmationResult,
} from "../dtos/document.dtos";
import {
  InitiateUploadCommandSchema,
  ConfirmUploadCommandSchema,
} from "../dtos/document.dtos";
import type { IDocumentRepository } from "../ports/document.repository.port";
import type { IDocumentVersionRepository } from "../ports/document-version.repository.port";
import { persistenceToDomain as documentPersistenceToDomain } from "../../infrastructure/mappers/document.mapper";
import { persistenceToDomain as versionPersistenceToDomain } from "../../infrastructure/mappers/document-version.mapper";
import { DatabaseService } from "../../effect/services/database.service";
import { randomBytes } from "crypto";

/**
 * Simple Upload Token Storage (In-Memory)
 * 
 * In a real system, this would be stored in a database or cache.
 * For training purposes, we use a simple in-memory Map.
 * 
 * This stores upload session information:
 * - Document ID
 * - Filename and file size
 * - Content type
 * - Expiration time
 */
class UploadTokenStore {
  private tokens = new Map<
    string,
    {
      documentId: string;
      filename: string;
      fileSize: number;
      contentType: string;
      expiresAt: Date;
    }
  >();

  /**
   * Create a new upload token
   */
  create(
    documentId: string,
    filename: string,
    fileSize: number,
    contentType: string,
    expiresInMinutes: number = 60
  ): string {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    this.tokens.set(token, {
      documentId,
      filename,
      fileSize,
      contentType,
      expiresAt,
    });

    return token;
  }

  /**
   * Get token data if valid and not expired
   */
  get(token: string): {
    documentId: string;
    filename: string;
    fileSize: number;
    contentType: string;
    expiresAt: Date;
  } | null {
    const data = this.tokens.get(token);
    if (!data) return null;
    if (data.expiresAt < new Date()) {
      this.tokens.delete(token);
      return null;
    }
    return data;
  }

  /**
   * Delete token (after successful upload confirmation)
   */
  delete(token: string): void {
    this.tokens.delete(token);
  }
}

const uploadTokenStore = new UploadTokenStore();

/**
 * Initiate Upload Use Case
 * 
 * Initiates an upload workflow by generating an upload token and URL.
 * The client uses this token to upload the file, then confirms with ConfirmUploadUseCase.
 * 
 * Business Workflow:
 * 1. Validate command input
 * 2. Verify document exists
 * 3. Generate upload token with expiration
 * 4. Return upload token and URL
 * 
 * Dependency Injection:
 * Repository is injected via constructor, following hexagonal architecture.
 */
export class InitiateUploadUseCase {
  constructor(private readonly documentRepo: IDocumentRepository) {}

  execute(
    command: InitiateUploadCommand
  ): Effect.Effect<UploadInitiationResult, UseCaseError, DatabaseService> {
    return pipe(
      // Step 1: Validate command
      Schema.decodeUnknown(InitiateUploadCommandSchema)(command),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "command",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Verify document exists
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
              operation: "InitiateUpload",
              message: `Repository error: ${repoError._tag}`,
            } as UseCaseError;
          }),
          // Step 3: Generate upload token and URL
          Effect.map(() => {
            const token = uploadTokenStore.create(
              validatedCommand.documentId,
              validatedCommand.filename,
              validatedCommand.fileSize,
              validatedCommand.contentType,
              60 // 60 minutes expiry
            );

            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 60);

            // Step 4: Return upload initiation result
            return {
              uploadToken: token,
              uploadUrl: `/api/documents/upload/${token}`, // Simplified URL (in production, would be pre-signed S3 URL)
              expiresAt: expiresAt.toISOString(),
              documentId: validatedCommand.documentId,
            } as UploadInitiationResult;
          })
        )
      )
    );
  }
}

/**
 * Confirm Upload Use Case
 * 
 * Confirms that an upload is complete and persists the document version.
 * Includes idempotency check using checksum to prevent duplicate uploads.
 * 
 * Business Workflow:
 * 1. Validate command input
 * 2. Verify upload token is valid and not expired
 * 3. Check for duplicate upload (idempotency via checksum)
 * 4. Create new document version or return existing one
 * 5. Update document with file information
 * 6. Delete upload token
 * 
 * Transaction Boundary:
 * This use case performs multiple repository operations (create version + update document).
 * In production, these should be wrapped in a database transaction to ensure atomicity.
 * For training purposes, this is simplified - each operation is independent.
 * 
 * Idempotency:
 * - Checksum-based duplicate detection prevents duplicate uploads
 * - If document already has the same checksum, returns existing version
 * - Prevents duplicate file storage and version creation
 * 
 * Dependency Injection:
 * Repositories are injected via constructor, following hexagonal architecture.
 */
export class ConfirmUploadUseCase {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly versionRepo: IDocumentVersionRepository
  ) {}

  execute(
    command: ConfirmUploadCommand
  ): Effect.Effect<UploadConfirmationResult, UseCaseError, DatabaseService> {
    return pipe(
      // Step 1: Validate command
      Schema.decodeUnknown(ConfirmUploadCommandSchema)(command),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "command",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Verify upload token
      Effect.flatMap((validatedCommand) => {
        const tokenData = uploadTokenStore.get(validatedCommand.uploadToken);
        if (!tokenData) {
          return Effect.fail({
            _tag: "InvalidUploadToken",
            token: validatedCommand.uploadToken,
          } as UseCaseError);
        }

        if (tokenData.expiresAt < new Date()) {
          uploadTokenStore.delete(validatedCommand.uploadToken);
          return Effect.fail({
            _tag: "UploadTokenExpired",
            token: validatedCommand.uploadToken,
          } as UseCaseError);
        }

        if (tokenData.documentId !== validatedCommand.documentId) {
          return Effect.fail({
            _tag: "InvalidUploadToken",
            token: validatedCommand.uploadToken,
          } as UseCaseError);
        }

        return Effect.succeed({ validatedCommand, tokenData });
      }),
      // Step 3: Check for duplicate upload (idempotency check)
      Effect.flatMap(({ validatedCommand, tokenData }) =>
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
              operation: "ConfirmUpload",
              message: `Repository error: ${repoError._tag}`,
            } as UseCaseError;
          }),
          Effect.flatMap((documentPersistence) =>
            pipe(
              documentPersistenceToDomain(documentPersistence),
              Effect.flatMap((document) => {
                // Step 3a: Check if document already has this checksum (idempotency)
                if (document.checksum === validatedCommand.checksum) {
                  // Find existing version with this checksum
                  return pipe(
                    this.versionRepo.findLatestByDocumentId(validatedCommand.documentId),
                    Effect.map((version) => ({
                      isDuplicate: true,
                      version,
                      document,
                    })),
                    Effect.catchAll(() =>
                      Effect.succeed({
                        isDuplicate: false,
                        document,
                      })
                    )
                  );
                }
                return Effect.succeed({
                  isDuplicate: false,
                  document,
                });
              }),
              Effect.flatMap((result: { isDuplicate: boolean; version?: any; document: any }) => {
                // Step 4: Handle duplicate or create new version
                if (result.isDuplicate && result.version) {
                  // Return existing version (idempotent - prevents duplicate storage)
                  return pipe(
                    versionPersistenceToDomain(result.version),
                    Effect.map((domainVersion) => ({
                      documentId: validatedCommand.documentId,
                      versionNumber: domainVersion.versionNumber,
                      checksum: validatedCommand.checksum,
                      filePath: validatedCommand.filePath,
                    }))
                  );
                }

                // Step 5: Create new version
                return pipe(
                  // Get latest version number
                  this.versionRepo.findLatestByDocumentId(validatedCommand.documentId),
                  Effect.map((latest) => latest.versionNumber + 1),
                  Effect.catchAll(() => Effect.succeed(1)), // First version
                  Effect.flatMap((nextVersionNumber) =>
                    pipe(
                      // Create version
                      this.versionRepo.create({
                        documentId: validatedCommand.documentId,
                        versionNumber: nextVersionNumber,
                      }),
                      Effect.mapError((repoError) => ({
                        _tag: "UseCaseUnknown",
                        operation: "ConfirmUpload",
                        message: `Failed to create version: ${repoError._tag}`,
                      } as UseCaseError)),
                      // Step 6: Update document with file info
                      Effect.flatMap((versionPersistence) =>
                        pipe(
                          this.documentRepo.update(validatedCommand.documentId, {
                            filename: tokenData.filename,
                            filePath: validatedCommand.filePath,
                            fileSize: validatedCommand.fileSize,
                            checksum: validatedCommand.checksum,
                          }),
                          Effect.mapError((repoError) => ({
                            _tag: "UseCaseUnknown",
                            operation: "ConfirmUpload",
                            message: `Failed to update document: ${repoError._tag}`,
                          } as UseCaseError)),
                          // Step 7: Delete token and return result
                          Effect.tap(() => {
                            uploadTokenStore.delete(validatedCommand.uploadToken);
                            return Effect.succeed(undefined);
                          }),
                          Effect.map(() => ({
                            documentId: validatedCommand.documentId,
                            versionNumber: versionPersistence.versionNumber,
                            checksum: validatedCommand.checksum,
                            filePath: validatedCommand.filePath,
                          }))
                        )
                      )
                    )
                  )
                );
              })
            )
          )
        )
      )
    );
  }
}
