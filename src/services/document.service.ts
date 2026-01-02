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
   * Refactored to use pipe and flatMap with Effect-based repository functions
   */
  static getAllDocuments(): Effect.Effect<Document[], Error, DatabaseService> {
    return pipe(
      DocumentRepository.findAll(),
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
   */
  static getDocumentById(id: number): Effect.Effect<Document, Error, DatabaseService> {
    return pipe(
      DocumentRepository.findById(id),
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
   */
  static updateDocument(
    id: number,
    metadataTags?: string[]
  ): Effect.Effect<Document, Error, DatabaseService> {
    // Build update data - only include metadataTags if provided
    const updateData: { metadataTags?: string } = {};
    if (metadataTags !== undefined) {
      updateData.metadataTags = JSON.stringify(metadataTags);
    }

    return pipe(
      DocumentRepository.update(id, updateData),
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
   */
  static deleteDocument(id: number): Effect.Effect<Document, Error, DatabaseService | ConfigService> {
    return pipe(
      DocumentRepository.findById(id),
      Effect.flatMap((document) =>
        pipe(
          // Delete file from disk (non-critical - log warning if fails but continue)
          FileUtils.deleteFileFromDisk(document.filePath),
          Effect.catchAll((error) => {
            console.warn("File deletion warning:", error.message);
            return Effect.succeed(undefined);
          }),
          Effect.flatMap(() => DocumentRepository.delete(id)),
          Effect.map(() => document)
        )
      )
    );
  }


  /**
   * Search documents by metadata tags
   * Refactored to use pipe and flatMap with Effect-based repository functions
   */
  static searchDocumentsByTags(searchTags: string[]): Effect.Effect<Document[], Error, DatabaseService> {
    return pipe(
      ValidationUtils.validateSearchTags(searchTags),
      Effect.flatMap((validatedTags) =>
        pipe(
          DocumentRepository.findByTags(validatedTags),
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
   */
  static generateDownloadLink(documentId: number): Effect.Effect<{
    token: string;
    expiresAt: string;
    downloadUrl: string;
    document: Document;
  }, Error, DatabaseService | ConfigService> {
    return pipe(
      DocumentRepository.findById(documentId),
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
   */
  static downloadDocumentByToken(token: string): Effect.Effect<{
    document: Document;
    filePath: string;
  }, Error, DatabaseService | ConfigService> {
    return pipe(
      DownloadTokenRepository.findValidToken(token),
      Effect.flatMap((downloadToken) =>
        pipe(
          DocumentRepository.findById(downloadToken.documentId),
          Effect.flatMap((document) =>
            pipe(
              FileUtils.checkFileExists(document.filePath),
              Effect.flatMap(() =>
                pipe(
                  // Mark token as used (non-critical - log warning if fails but continue)
                  DownloadTokenRepository.markAsUsed(downloadToken.id),
                  Effect.catchAll((error) => {
                    console.warn("Failed to mark token as used:", error.message);
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

