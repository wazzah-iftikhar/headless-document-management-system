import { DocumentRepository, DownloadTokenRepository } from "../repositories";
import { config } from "../config/app";
import { generateDownloadToken } from "../utils/token";
import type { Document } from "../models";
import type { DownloadToken } from "../models/download-token.model";
import { ok, err, type Result } from "../utils/result";
import { FileUtils } from "../utils/file.utils";
import { ValidationUtils } from "../utils/validation.utils";
import { Effect, pipe } from "effect";
import { AppLayer } from "../effect/layers";
import { DatabaseService } from "../effect/services/database.service";
import { ConfigService } from "../effect/services/config.service";
import type { ServiceError } from "../errors/service.errors";
import { mapRepoErrorToServiceError } from "../errors/service.errors";


export class DocumentService {
  
  /**
   * Create a new document
   * Refactored to use pipe and flatMap with Effect-based FileUtils functions
   * Maps RepoError to ServiceError at boundary
   */
  static createDocument(
    file: File,
    metadataTags?: string[]
  ): Effect.Effect<Document, ServiceError, DatabaseService | ConfigService> {
    
    return pipe(
      FileUtils.validateFile(file),
      // Map FileUtils errors to domain errors
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
                      DocumentRepository.create({
                        filename: pathData.filename,
                        originalFilename: validatedFile.name,
                        filePath: pathData.filePath,
                        fileSize: validatedFile.size,
                        metadataTags: JSON.stringify(metadataTags || []),
                      }),
                      // Map RepoError to ServiceError at boundary
                      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "createDocument"))
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
   * Refactored to use pipe and map with Effect-based repository functions
   * Maps RepoError to ServiceError at boundary
   */
  static getAllDocuments(): Effect.Effect<Document[], ServiceError, DatabaseService> {
    return pipe(
      DocumentRepository.findAll(),
      // Map RepoError to ServiceError at boundary
      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "getAllDocuments")),
      Effect.map((documents) => {
        // Format documents (parse metadataTags from JSON)
        const formattedDocuments = documents.map((doc) => ({
          ...doc,
          metadataTags: doc.metadataTags ? JSON.parse(doc.metadataTags) : [],
        }));
        return formattedDocuments;
      })
    );
  }

  /**
   * Get document by ID
   * Refactored to use pipe and map with Effect-based repository functions
   * Maps RepoError to ServiceError at boundary
   */
  static getDocumentById(id: number): Effect.Effect<Document, ServiceError, DatabaseService> {
    return pipe(
      DocumentRepository.findById(id),
      // Map RepoError to ServiceError at boundary (handles DocumentNotFound, DB errors)
      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "getDocumentById")),
      Effect.map((document) => {
        // Format document (parse metadataTags from JSON)
        const formattedDocument = {
          ...document,
          metadataTags: document.metadataTags
            ? JSON.parse(document.metadataTags)
            : [],
        };
        return formattedDocument;
      })
    );
  }

  /**
   * Update document by ID
   * Refactored to use pipe and map with Effect-based repository functions
   * Maps RepoError to ServiceError at boundary
   */
  static updateDocument(
    id: number,
    metadataTags?: string[]
  ): Effect.Effect<Document, ServiceError, DatabaseService> {
    // Build update data - only include metadataTags if provided
    const updateData: { metadataTags?: string } = {};
    if (metadataTags !== undefined) {
      updateData.metadataTags = JSON.stringify(metadataTags);
    }

    return pipe(
      DocumentRepository.update(id, updateData),
      // Map RepoError to ServiceError at boundary (handles DocumentNotFound, DB errors)
      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "updateDocument")),
      Effect.map((document) => {
        // Format document (parse metadataTags from JSON)
        const formattedDocument = {
          ...document,
          metadataTags: document.metadataTags
            ? JSON.parse(document.metadataTags)
            : [],
        };
        return formattedDocument;
      })
    );
  }


  /**
   * Delete document by ID
   * Refactored to use pipe and flatMap with Effect-based repository and file utils functions
   * Maps RepoError to ServiceError at boundary
   */
  static deleteDocument(id: number): Effect.Effect<Document, ServiceError, DatabaseService | ConfigService> {
    return pipe(
      DocumentRepository.findById(id),
      // Map RepoError to ServiceError at boundary (handles DocumentNotFound, DB errors)
      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "deleteDocument")),
      Effect.flatMap((document) =>
        pipe(
          // Delete file from disk (non-critical - log warning if fails but continue)
          FileUtils.deleteFileFromDisk(document.filePath),
          Effect.catchAll((error) => {
            console.warn("File deletion warning:", error.message);
            return Effect.succeed(undefined);
          }),
          Effect.flatMap(() =>
            pipe(
              DocumentRepository.delete(id),
              // Map RepoError to ServiceError at boundary
              Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "deleteDocument")),
              Effect.map(() => document)
            )
          )
        )
      )
    );
  }


  /**
   * Search documents by metadata tags
   * Refactored to use pipe and flatMap with Effect-based repository functions
   * Maps RepoError to ServiceError at boundary
   */
  static searchDocumentsByTags(searchTags: string[]): Effect.Effect<Document[], ServiceError, DatabaseService> {
    return pipe(
      ValidationUtils.validateSearchTags(searchTags),
      // Map validation errors to domain errors
      Effect.mapError((error: Error) => {
        return { _tag: "InvalidSearchTags", message: error.message } as ServiceError;
      }),
      Effect.flatMap((validatedTags) =>
        pipe(
          DocumentRepository.findByTags(validatedTags),
          // Map RepoError to ServiceError at boundary
          Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "searchDocumentsByTags")),
          Effect.map((documents) =>
            // Format documents (parse metadataTags from JSON)
            documents.map((doc) => ({
              ...doc,
              metadataTags: doc.metadataTags ? JSON.parse(doc.metadataTags) : [],
            }))
          )
        )
      )
    );
  }


  /**
   * Generate download link for a document
   * Refactored to use pipe and flatMap with Effect-based repository functions
   * Maps RepoError to ServiceError at boundary
   */
  static generateDownloadLink(documentId: number): Effect.Effect<{
    token: string;
    expiresAt: string;
    downloadUrl: string;
    document: Document;
  }, ServiceError, DatabaseService | ConfigService> {
    return pipe(
      DocumentRepository.findById(documentId),
      // Map RepoError to ServiceError at boundary (handles DocumentNotFound, DB errors)
      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "generateDownloadLink")),
      Effect.flatMap((document) =>
        pipe(
          Effect.map(ConfigService, (configService) => configService.downloadLinkExpiryMinutes),
          Effect.flatMap((expiryMinutes) => {
            // Generate secure token
            const token = generateDownloadToken();

            // Calculate expiration time
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

            // Save token to database
            return pipe(
              DownloadTokenRepository.create({
                token,
                documentId,
                expiresAt: expiresAt.toISOString(),
              }),
              // Map RepoError to ServiceError at boundary
              Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "generateDownloadLink")),
              Effect.map((downloadToken) => {
                const downloadUrl = `/documents/download/${token}`;
                return {
                  token,
                  expiresAt: downloadToken.expiresAt,
                  downloadUrl,
                  document,
                };
              })
            );
          })
        )
      )
    );
  }


  /**
   * Download document by token
   * Refactored to use pipe and flatMap with Effect-based repository and file utils functions
   * Maps RepoError to ServiceError at boundary
   */
  static downloadDocumentByToken(token: string): Effect.Effect<{
    document: Document;
    filePath: string;
  }, ServiceError, DatabaseService | ConfigService> {
    return pipe(
      DownloadTokenRepository.findValidToken(token),
      // Map RepoError to ServiceError at boundary (handles TokenNotFound, TokenExpired, DB errors)
      Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "downloadDocumentByToken")),
      // Check if token is already used (domain validation)
      Effect.flatMap((downloadToken) => {
        if (downloadToken.usedAt) {
          return Effect.fail({ _tag: "DownloadTokenAlreadyUsed", token } as ServiceError);
        }
        return Effect.succeed(downloadToken);
      }),
      Effect.flatMap((downloadToken) =>
        pipe(
          DocumentRepository.findById(downloadToken.documentId),
          // Map RepoError to ServiceError at boundary (handles DocumentNotFound, DB errors)
          Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "downloadDocumentByToken")),
          Effect.flatMap((document) =>
            pipe(
              FileUtils.checkFileExists(document.filePath),
              // Map file errors to domain errors
              Effect.mapError((error: Error) => {
                return { _tag: "FileNotFound", filePath: document.filePath } as ServiceError;
              }),
              Effect.flatMap(() =>
                pipe(
                  // Mark token as used (non-critical - log warning if fails but continue)
                  DownloadTokenRepository.markAsUsed(downloadToken.id),
                  // Map RepoError to ServiceError at boundary
                  Effect.mapError((repoError) => mapRepoErrorToServiceError(repoError, "downloadDocumentByToken")),
                  Effect.catchAll((error) => {
                    console.warn("Failed to mark token as used:", error);
                    return Effect.succeed(undefined);
                  }),
                  Effect.map(() => ({
                    document,
                    filePath: document.filePath,
                  }))
                )
              )
            )
          )
        )
      )
    );
  }

}

