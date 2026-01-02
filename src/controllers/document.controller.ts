import { DocumentService } from "../services/document.service";
import { successResponse, errorResponse } from "../utils/response";
import { config } from "../config/app";
import { HttpUtils } from "../utils/http.utils";
import { Effect, pipe } from "effect";
import { AppLayer } from "../effect/layers";
import type { Document } from "../models";


export class DocumentController {
  /**
   * Upload a PDF document
   */
  /**
   * Upload a PDF document
   * Refactored to use Effect-based service with functional error handling
   * Uses Effect.match to handle errors functionally without try-catch
   */
  static async uploadDocument(file: File, metadataTags?: string[]) {
    return Effect.runPromise(
      pipe(
        DocumentService.createDocument(file, metadataTags),
        Effect.provide(AppLayer),
        Effect.match({
          onFailure: (error: Error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            const status = Effect.runSync(HttpUtils.getStatusFromError(err));
            return {
              status,
              body: errorResponse(err.message),
            };
          },
          onSuccess: (document: Document) => ({
            status: 201,
            body: successResponse(
              {
                id: document.id,
                filename: document.filename,
                originalFilename: document.originalFilename,
                fileSize: document.fileSize,
                metadataTags: metadataTags || [],
                createdAt: document.createdAt,
              },
              "Document uploaded successfully"
            ),
          }),
        })
      )
    );
  }

  /**
   * Get all documents
   * Refactored to use Effect-based service with functional error handling
   * Uses Effect.match to handle errors functionally without try-catch
   */
  static async getAllDocuments() {
    return Effect.runPromise(
      pipe(
        DocumentService.getAllDocuments(),
        Effect.provide(AppLayer),
        Effect.match({
          onFailure: (error: Error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            const status = Effect.runSync(HttpUtils.getStatusFromError(err));
            return {
              status,
              body: errorResponse(err.message),
            };
          },
          onSuccess: (documents: Document[]) => ({
            status: 200,
            body: successResponse(documents),
          }),
        })
      )
    );
  }

  /**
   * Get document by ID
   * Refactored to use Effect-based service with functional error handling
   * Uses Effect.match to handle errors functionally without try-catch
   */
  static async getDocumentById(id: number) {
    return Effect.runPromise(
      pipe(
        DocumentService.getDocumentById(id),
        Effect.provide(AppLayer),
        Effect.match({
          onFailure: (error: Error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            const status = Effect.runSync(HttpUtils.getStatusFromError(err));
            return {
              status,
              body: errorResponse(err.message),
            };
          },
          onSuccess: (document: Document) => ({
            status: 200,
            body: successResponse(document),
          }),
        })
      )
    );
  }

  /**
   * Update document metadata
   * Refactored to use Effect-based service with functional error handling
   * Uses Effect.match to handle errors functionally without try-catch
   */
  static async updateDocument(id: number, metadataTags?: string[]) {
    return Effect.runPromise(
      pipe(
        DocumentService.updateDocument(id, metadataTags),
        Effect.provide(AppLayer),
        Effect.match({
          onFailure: (error: Error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            const status = Effect.runSync(HttpUtils.getStatusFromError(err));
            return {
              status,
              body: errorResponse(err.message),
            };
          },
          onSuccess: (document: Document) => ({
            status: 200,
            body: successResponse(document, "Document updated successfully"),
          }),
        })
      )
    );
  }

  /**
   * Delete document
   * Refactored to use Effect-based service with functional error handling
   * Uses Effect.match to handle errors functionally without try-catch
   */
  static async deleteDocument(id: number) {
    return Effect.runPromise(
      pipe(
        DocumentService.deleteDocument(id),
        Effect.provide(AppLayer),
        Effect.match({
          onFailure: (error: Error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            const status = Effect.runSync(HttpUtils.getStatusFromError(err));
            return {
              status,
              body: errorResponse(err.message),
            };
          },
          onSuccess: (document: Document) => ({
            status: 200,
            body: successResponse(
              {
                id: document.id,
                filename: document.filename,
              },
              "Document deleted successfully"
            ),
          }),
        })
      )
    );
  }

  /**
   * Search documents by metadata tags
   * Refactored to use Effect-based service with functional error handling
   * Uses Effect.match to handle errors functionally without try-catch
   */
  static async searchDocumentsByTags(searchTags: string[]) {
    return Effect.runPromise(
      pipe(
        DocumentService.searchDocumentsByTags(searchTags),
        Effect.provide(AppLayer),
        Effect.match({
          onFailure: (error: Error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            const status = Effect.runSync(HttpUtils.getStatusFromError(err));
            return {
              status,
              body: errorResponse(err.message),
            };
          },
          onSuccess: (documents: Document[]) => ({
            status: 200,
            body: successResponse(
              {
                documents,
                count: documents.length,
                searchTags,
              },
              `Found ${documents.length} document(s) matching the search criteria`
            ),
          }),
        })
      )
    );
  }

  /**
   * Generate a short-lived download link for a document
   * Refactored to use Effect-based service with functional error handling
   * Uses Effect.match to handle errors functionally without try-catch
   */
  static async generateDownloadLink(documentId: number) {
    return Effect.runPromise(
      pipe(
        DocumentService.generateDownloadLink(documentId),
        Effect.provide(AppLayer),
        Effect.match({
          onFailure: (error: Error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            const status = Effect.runSync(HttpUtils.getStatusFromError(err));
            return {
              status,
              body: errorResponse(err.message),
            };
          },
          onSuccess: (downloadLink) => ({
            status: 200,
            body: successResponse(
              {
                downloadUrl: downloadLink.downloadUrl,
                token: downloadLink.token,
                expiresAt: downloadLink.expiresAt,
                expiresInMinutes: config.downloadLinkExpiryMinutes,
                documentId: downloadLink.document.id,
                originalFilename: downloadLink.document.originalFilename,
              },
              "Download link generated successfully"
            ),
          }),
        })
      )
    );
  }

  /**
   * Download document using a token
   * Refactored to use Effect-based service with functional error handling
   * Uses Effect.match to handle errors functionally without try-catch
   */
  static async downloadDocumentByToken(token: string) {
    return Effect.runPromise(
      pipe(
        DocumentService.downloadDocumentByToken(token),
        Effect.provide(AppLayer),
        Effect.match({
          onFailure: (error: Error) => {
            const err = error instanceof Error ? error : new Error(String(error));
            const status = Effect.runSync(HttpUtils.getStatusFromError(err));
            return {
              status,
              body: errorResponse(err.message),
            };
          },
          onSuccess: (downloadData) => {
            // Return file for download
            const file = Bun.file(downloadData.filePath);
            return new Response(file, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${downloadData.document.originalFilename}"`,
                "Content-Length": downloadData.document.fileSize.toString(),
              },
            });
          },
        })
      )
    );
  }
  
}
