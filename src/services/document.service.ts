import { DocumentRepositoryImpl } from "../infrastructure/repositories/implementations/document.repository.impl";
import { DownloadTokenRepository } from "../repositories"; // Keep old for now
import { config } from "../config/app";
import { generateDownloadToken } from "../utils/token";
import { FileUtils } from "../utils/file.utils";
import { ValidationUtils } from "../utils/validation.utils";
import { Effect, pipe } from "effect";
import { AppLayer } from "../effect/layers";
import { DatabaseService } from "../effect/services/database.service";
import { ConfigService } from "../effect/services/config.service";
import type { ServiceError } from "../errors/service.errors";
import { mapRepoErrorToServiceError } from "../errors/service.errors";
import { domainToPersistence, persistenceToDomain } from "../infrastructure/mappers/document.mapper";
import { DocumentIdVO } from "../domain/document/value-objects/document-id.vo";
import { FileReferenceVO } from "../domain/document/value-objects/file-reference.vo";
import { MetadataTagsVO } from "../domain/document/value-objects/metadata-tags.vo";
import { DateTimeVO } from "../domain/document/value-objects/date-time.vo";
import type { DocumentDomain } from "../domain/document/document.entity.schema";
import type { DocumentPersistence } from "../domain/document/document.entity.schema";

// Response type compatible with old Document type for backward compatibility
export type Document = {
  id: string; // UUID string
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  checksum?: string;
  metadataTags: string[]; // Parsed from JSON
  createdAt: string;
  updatedAt: string;
};

const documentRepo = new DocumentRepositoryImpl();

/**
 * Map DocumentDomain to response Document type
 * DocumentDomain has plain values from schema (not value objects)
 */
function domainToResponse(domain: DocumentDomain): Document {
  return {
    id: domain.id, // Already a UUID string
    filename: domain.fileReference.filename,
    originalFilename: domain.fileReference.originalFilename,
    filePath: domain.fileReference.filePath,
    fileSize: domain.fileSize,
    checksum: domain.checksum, // Already a string or undefined
    metadataTags: [...domain.metadataTags], // Copy array to make it mutable
    createdAt: domain.createdAt.toISOString(), // Date to ISO string
    updatedAt: domain.updatedAt.toISOString(), // Date to ISO string
  };
}

export class DocumentService {
  
  /**
   * Create a new document
   * Uses new repository and domain entities
   */
  static createDocument(
    file: File,
    metadataTags?: string[]
  ): Effect.Effect<Document, ServiceError, DatabaseService | ConfigService> {
    
    return pipe(
      FileUtils.validateFile(file),
      Effect.mapError((error: Error) => {
        const message = error.message.toLowerCase();
        if (message.includes("only pdf") || message.includes("pdf")) {
          return { _tag: "InvalidFileType", message: error.message } as ServiceError;
        }
        if (message.includes("size") || message.includes("exceeds")) {
          const match = error.message.match(/(\d+)/g);
          const maxSize = match ? parseInt(match[0]) : 0;
          return { _tag: "FileTooLarge", maxSize, actualSize: file.size } as ServiceError;
        }
        return { _tag: "ServiceUnknown", operation: "createDocument", message: error.message } as ServiceError;
      }),
      Effect.flatMap((validatedFile) =>
        pipe(
          FileUtils.ensureUploadDirectory(),
          Effect.mapError(() => ({ _tag: "ServiceUnavailable", operation: "createDocument" } as ServiceError)),
          Effect.flatMap(() =>
            pipe(
              FileUtils.generateFilePath(validatedFile),
              Effect.mapError(() => ({ _tag: "ServiceUnavailable", operation: "createDocument" } as ServiceError)),
              Effect.flatMap((pathData) =>
                pipe(
                  FileUtils.saveFileToDisk(validatedFile, pathData.filePath),
                  Effect.mapError(() => ({ _tag: "ServiceUnavailable", operation: "createDocument" } as ServiceError)),
                  Effect.flatMap(() =>
                    pipe(
                      // Create persistence data
                      documentRepo.create({
                        filename: pathData.filename,
                        originalFilename: validatedFile.name,
                        filePath: pathData.filePath,
                        fileSize: validatedFile.size,
                        metadataTags: JSON.stringify(metadataTags || []),
                      }),
                      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "createDocument")),
                      // Convert persistence to domain, then to response
                      Effect.flatMap((persistence) => persistenceToDomain(persistence)),
                      Effect.map((domain) => domainToResponse(domain))
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

  /**
   * Get all documents
   * Uses new repository with pagination support
   */
  static getAllDocuments(): Effect.Effect<Document[], ServiceError, DatabaseService> {
    return pipe(
      documentRepo.findAll({ page: 1, limit: 1000 }), // Get all (high limit)
      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "getAllDocuments")),
      Effect.flatMap((paginated) =>
        Effect.all(
          paginated.data.map((persistence) => persistenceToDomain(persistence))
        )
      ),
      Effect.map((domains) => domains.map(domainToResponse))
    );
  }

  /**
   * Get document by ID (UUID string)
   * Uses new repository
   */
  static getDocumentById(id: string): Effect.Effect<Document, ServiceError, DatabaseService> {
    return pipe(
      // Validate UUID format
      DocumentIdVO.fromString(id),
      Effect.mapError(() => ({ _tag: "DocumentNotFound", documentId: id } as ServiceError)),
      Effect.flatMap(() =>
        pipe(
          documentRepo.findById(id),
          Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "getDocumentById")),
          Effect.flatMap((persistence) => persistenceToDomain(persistence)),
          Effect.map((domain) => domainToResponse(domain))
        )
      )
    );
  }

  /**
   * Update document by ID (UUID string)
   * Uses new repository
   */
  static updateDocument(
    id: string,
    metadataTags?: string[]
  ): Effect.Effect<Document, ServiceError, DatabaseService> {
    return pipe(
      DocumentIdVO.fromString(id),
      Effect.mapError(() => ({ _tag: "DocumentNotFound", documentId: id } as ServiceError)),
      Effect.flatMap(() =>
        pipe(
          documentRepo.update(id, {
            metadataTags: metadataTags !== undefined ? JSON.stringify(metadataTags) : undefined,
          }),
          Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "updateDocument")),
          Effect.flatMap((persistence) => persistenceToDomain(persistence)),
          Effect.map((domain) => domainToResponse(domain))
        )
      )
    );
  }

  /**
   * Delete document by ID (UUID string)
   * Uses new repository
   */
  static deleteDocument(id: string): Effect.Effect<Document, ServiceError, DatabaseService | ConfigService> {
    return pipe(
      DocumentIdVO.fromString(id),
      Effect.mapError(() => ({ _tag: "DocumentNotFound", documentId: id } as ServiceError)),
      Effect.flatMap(() =>
        pipe(
          documentRepo.findById(id),
          Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "deleteDocument")),
          Effect.flatMap((persistence) => persistenceToDomain(persistence)),
          Effect.flatMap((domain) =>
            pipe(
              FileUtils.deleteFileFromDisk(domain.fileReference.filePath),
              Effect.catchAll((error) => {
                console.warn("File deletion warning:", error.message);
                return Effect.succeed(undefined);
              }),
              Effect.flatMap(() =>
                pipe(
                  documentRepo.delete(id),
                  Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "deleteDocument")),
                  Effect.map(() => domainToResponse(domain))
                )
              )
            )
          )
        )
      )
    );
  }

  /**
   * Search documents by metadata tags
   * Uses new repository
   */
  static searchDocumentsByTags(searchTags: string[]): Effect.Effect<Document[], ServiceError, DatabaseService> {
    return pipe(
      ValidationUtils.validateSearchTags(searchTags),
      Effect.mapError((error: Error) => {
        return { _tag: "InvalidSearchTags", message: error.message } as ServiceError;
      }),
      Effect.flatMap((validatedTags) =>
        pipe(
          documentRepo.findByTags(validatedTags, { page: 1, limit: 1000 }),
          Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "searchDocumentsByTags")),
          Effect.flatMap((paginated) =>
            Effect.all(
              paginated.data.map((persistence) => persistenceToDomain(persistence))
            )
          ),
          Effect.map((domains) => domains.map(domainToResponse))
        )
      )
    );
  }

  /**
   * Generate download link for a document (UUID string)
   * Uses new repository for document lookup, old repository for tokens
   */
  static generateDownloadLink(documentId: string): Effect.Effect<{
    token: string;
    expiresAt: string;
    downloadUrl: string;
    document: Document;
  }, ServiceError, DatabaseService | ConfigService> {
    return pipe(
      DocumentIdVO.fromString(documentId),
      Effect.mapError(() => ({ _tag: "DocumentNotFound", documentId } as ServiceError)),
      Effect.flatMap(() =>
        pipe(
          documentRepo.findById(documentId),
          Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "generateDownloadLink")),
          Effect.flatMap((persistence) => persistenceToDomain(persistence)),
          Effect.flatMap((domain) =>
            pipe(
              Effect.map(ConfigService, (configService) => configService.downloadLinkExpiryMinutes),
              Effect.flatMap((expiryMinutes) => {
                const token = generateDownloadToken();
                const expiresAt = new Date();
                expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

                // Use DownloadTokenRepository (now supports UUID strings)
                return pipe(
                  DownloadTokenRepository.create({
                    token,
                    documentId, // UUID string
                    expiresAt: expiresAt.toISOString(),
                  }),
                  Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "generateDownloadLink")),
                  Effect.map((downloadToken) => ({
                    token,
                    expiresAt: downloadToken.expiresAt,
                    downloadUrl: `/documents/download/${token}`,
                    document: domainToResponse(domain),
                  }))
                );
              })
            )
          )
        )
      )
    );
  }

  /**
   * Download document by token
   * Uses old repository for tokens, new repository for documents
   */
  static downloadDocumentByToken(token: string): Effect.Effect<{
    document: Document;
    filePath: string;
  }, ServiceError, DatabaseService | ConfigService> {
    return pipe(
      DownloadTokenRepository.findValidToken(token),
      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "downloadDocumentByToken")),
      Effect.flatMap((downloadToken) => {
        if (downloadToken.usedAt) {
          return Effect.fail({ _tag: "DownloadTokenAlreadyUsed", token } as ServiceError);
        }
        return Effect.succeed(downloadToken);
      }),
      Effect.flatMap((downloadToken) => {
        // documentId is now a UUID string
        const documentId = downloadToken.documentId;
        return pipe(
          documentRepo.findById(documentId),
          Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "downloadDocumentByToken")),
          Effect.flatMap((persistence) => persistenceToDomain(persistence)),
          Effect.flatMap((domain) =>
            pipe(
              FileUtils.checkFileExists(domain.fileReference.filePath),
              Effect.mapError((error: Error) => {
                return { _tag: "FileNotFound", filePath: domain.fileReference.filePath } as ServiceError;
              }),
              Effect.flatMap(() =>
                pipe(
                  DownloadTokenRepository.markAsUsed(downloadToken.id),
                  Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "downloadDocumentByToken")),
                  Effect.catchAll((error) => {
                    console.warn("Failed to mark token as used:", error);
                    return Effect.succeed(undefined);
                  }),
                  Effect.map(() => ({
                    document: domainToResponse(domain),
                    filePath: domain.fileReference.filePath,
                  }))
                )
              )
            )
          )
        );
      })
    );
  }
}
