import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import type { UseCaseError } from "../errors/use-case.errors";
import type {
  GenerateDownloadLinkQuery,
  DownloadByTokenQuery,
  DownloadLinkResult,
  DownloadResult,
  DocumentResult,
} from "../dtos/document.dtos";
import {
  GenerateDownloadLinkQuerySchema,
  DownloadByTokenQuerySchema,
} from "../dtos/document.dtos";
import type { IDocumentRepository } from "../ports/document.repository.port";
import type { IDownloadTokenRepository } from "../ports/download-token.repository.port";
import { persistenceToDomain } from "../../infrastructure/mappers/document.mapper";
import type { DocumentDomain } from "../../domain/document/document.entity.schema";
import { DatabaseService } from "../../effect/services/database.service";
import { ConfigService } from "../../effect/services/config.service";
import { FileSystemService } from "../../effect/services/filesystem.service";
import { generateDownloadToken } from "../../infrastructure/services/token.service";

/**
 * Generate Download Link Use Case
 * 
 * Generates a secure, time-limited download link for a document.
 * 
 * Business Workflow:
 * 1. Validate query input
 * 2. Verify document exists
 * 3. Generate secure token
 * 4. Create download token record with expiration
 * 5. Return download link result
 * 
 * Transaction Boundary:
 * Two operations (verify document + create token).
 * In production, these should be in a transaction. Simplified for training.
 * 
 * Dependency Injection:
 * Repositories and services are injected via constructor, following hexagonal architecture.
 */
export class GenerateDownloadLinkUseCase {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly tokenRepo: IDownloadTokenRepository
  ) {}

  execute(
    query: GenerateDownloadLinkQuery
  ): Effect.Effect<DownloadLinkResult, UseCaseError, DatabaseService | ConfigService> {
    return pipe(
      // Step 1: Validate query
      Schema.decodeUnknown(GenerateDownloadLinkQuerySchema)(query),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "query",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Verify document exists
      Effect.flatMap((validatedQuery) =>
        pipe(
          this.documentRepo.findById(validatedQuery.documentId),
          Effect.mapError((repoError) => {
            if (repoError._tag === "DocumentNotFound") {
              return {
                _tag: "DocumentNotFound",
                documentId: repoError.documentId,
              } as UseCaseError;
            }
            return {
              _tag: "UseCaseUnknown",
              operation: "GenerateDownloadLink",
              message: `Repository error: ${repoError._tag}`,
            } as UseCaseError;
          }),
          // Step 3: Convert to domain and generate token
          Effect.flatMap((persistence) => persistenceToDomain(persistence)),
          Effect.flatMap((domain) =>
            pipe(
              ConfigService,
              Effect.flatMap((config) => {
                const token = generateDownloadToken();
                const expiresAt = new Date();
                expiresAt.setMinutes(expiresAt.getMinutes() + config.downloadLinkExpiryMinutes);

                // Step 4: Create download token
                return pipe(
                  this.tokenRepo.create({
                    token,
                    documentId: validatedQuery.documentId,
                    expiresAt: expiresAt.toISOString(),
                    usedAt: null,
                  }),
                  Effect.mapError((repoError) => ({
                    _tag: "UseCaseUnknown",
                    operation: "GenerateDownloadLink",
                    message: `Failed to create token: ${repoError._tag}`,
                  } as UseCaseError)),
                  // Step 5: Return download link result
                  Effect.map(() => ({
                    token,
                    expiresAt: expiresAt.toISOString(),
                    downloadUrl: `/documents/download/${token}`,
                    document: this.domainToResult(domain),
                  }))
                );
              })
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

/**
 * Download By Token Use Case
 * 
 * Downloads a document using a valid download token.
 * 
 * Business Workflow:
 * 1. Validate query input
 * 2. Verify token is valid and not expired
 * 3. Check if token has been used
 * 4. Fetch document
 * 5. Verify file exists on disk
 * 6. Mark token as used (non-critical)
 * 7. Return download result
 * 
 * Transaction Boundary:
 * Multiple read operations (token + document + file check).
 * Token marking is non-critical and can fail without affecting download.
 * 
 * Dependency Injection:
 * Repositories and services are injected via constructor, following hexagonal architecture.
 */
export class DownloadByTokenUseCase {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly tokenRepo: IDownloadTokenRepository
  ) {}

  execute(
    query: DownloadByTokenQuery
  ): Effect.Effect<DownloadResult, UseCaseError, DatabaseService | FileSystemService> {
    return pipe(
      // Step 1: Validate query
      Schema.decodeUnknown(DownloadByTokenQuerySchema)(query),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "query",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Verify token is valid
      Effect.flatMap((validatedQuery) =>
        pipe(
          this.tokenRepo.findValidToken(validatedQuery.token),
          Effect.mapError((repoError) => {
            if (repoError._tag === "TokenNotFound" || repoError._tag === "TokenExpired") {
              return {
                _tag: "InvalidUploadToken",
                token: validatedQuery.token,
              } as UseCaseError;
            }
            return {
              _tag: "UseCaseUnknown",
              operation: "DownloadByToken",
              message: `Token repository error: ${repoError._tag}`,
            } as UseCaseError;
          }),
          // Step 3: Check if token has been used
          Effect.flatMap((token) => {
            if (token.usedAt) {
              return Effect.fail({
                _tag: "InvalidUploadToken",
                token: validatedQuery.token,
              } as UseCaseError);
            }
            return Effect.succeed(token);
          }),
          // Step 4: Fetch document
          Effect.flatMap((token) =>
            pipe(
              this.documentRepo.findById(token.documentId),
              Effect.mapError((repoError) => {
                if (repoError._tag === "DocumentNotFound") {
                  return {
                    _tag: "DocumentNotFound",
                    documentId: token.documentId,
                  } as UseCaseError;
                }
                return {
                  _tag: "UseCaseUnknown",
                  operation: "DownloadByToken",
                  message: `Repository error: ${repoError._tag}`,
                } as UseCaseError;
              }),
              // Step 5: Convert to domain and verify file exists
              Effect.flatMap((persistence) => persistenceToDomain(persistence)),
              Effect.flatMap((domain) =>
                pipe(
                  FileSystemService,
                  Effect.flatMap((fs) =>
                    Effect.tryPromise({
                      try: () => fs.exists(domain.fileReference.filePath),
                      catch: (error) => error as Error,
                    })
                  ),
                  Effect.flatMap((exists) => {
                    if (!exists) {
                      return Effect.fail({
                        _tag: "UseCaseUnknown",
                        operation: "DownloadByToken",
                        message: `File not found: ${domain.fileReference.filePath}`,
                      } as UseCaseError);
                    }
                    return Effect.succeed(undefined);
                  }),
                  // Step 6: Mark token as used (non-critical)
                  Effect.flatMap(() =>
                    pipe(
                      this.tokenRepo.markAsUsed(token.id),
                      Effect.catchAll((error) => {
                        console.warn("Failed to mark token as used:", error);
                        return Effect.succeed(undefined);
                      }),
                      // Step 7: Return download result
                      Effect.map(() => ({
                        document: this.domainToResult(domain),
                        filePath: domain.fileReference.filePath,
                      }))
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
