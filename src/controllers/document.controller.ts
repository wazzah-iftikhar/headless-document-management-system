import { DocumentService } from "../services/document.service";
import { successResponse, errorResponse } from "../utils/response";
import { config } from "../config/app";
import { HttpUtils } from "../utils/http.utils";
import { Effect, pipe } from "effect";
import { AppLayer } from "../effect/layers";
import type { Document } from "../models";
import type { HttpError } from "../errors/controller.errors";
import { mapServiceErrorToHttpError, httpErrorToStatus } from "../errors/controller.errors";
import { validateResponse } from "../middleware/schema-validator";
import {
  uploadDocumentResponseSchema,
  documentListResponseSchema,
  documentResponseSchema,
  updateDocumentResponseSchema,
  deleteDocumentResponseSchema,
  searchDocumentsResponseSchema,
  downloadLinkResponseSchema,
  successResponseSchema,
} from "../validations/document.schema";


export class DocumentController {
  /**
   * Upload a PDF document
   */
  /**
   * Upload a PDF document
   * Refactored to use Effect-based service with functional error handling
   * Maps ServiceError to HttpError at boundary
   */
  static async uploadDocument(file: File, metadataTags?: string[]) {
    return Effect.runPromise(
      pipe(
        DocumentService.createDocument(file, metadataTags),
        Effect.provide(AppLayer),
        // Map ServiceError to HttpError at boundary
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (document: Document) => {
            const responseData = {
              id: document.id,
              filename: document.filename,
              originalFilename: document.originalFilename,
              fileSize: document.fileSize,
              metadataTags: metadataTags || [],
              createdAt: document.createdAt,
            };
            const validatedData = validateResponse(responseData, uploadDocumentResponseSchema);
            const response = successResponse(validatedData, "Document uploaded successfully");
            return {
              status: 201,
              body: validateResponse(response, successResponseSchema(uploadDocumentResponseSchema)),
            };
          },
        })
      )
    );
  }

  /**
   * Get all documents
   * Refactored to use Effect-based service with functional error handling
   * Maps ServiceError to HttpError at boundary
   */
  static async getAllDocuments() {
    return Effect.runPromise(
      pipe(
        DocumentService.getAllDocuments(),
        Effect.provide(AppLayer),
        // Map ServiceError to HttpError at boundary
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (documents: Document[]) => {
            const validatedData = validateResponse(documents, documentListResponseSchema);
            const response = successResponse(validatedData);
            return {
              status: 200,
              body: validateResponse(response, successResponseSchema(documentListResponseSchema)),
            };
          },
        })
      )
    );
  }

  /**
   * Get document by ID
   * Refactored to use Effect-based service with functional error handling
   * Maps ServiceError to HttpError at boundary
   */
  static async getDocumentById(id: number) {
    return Effect.runPromise(
      pipe(
        DocumentService.getDocumentById(id),
        Effect.provide(AppLayer),
        // Map ServiceError to HttpError at boundary
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (document: Document) => {
            const validatedData = validateResponse(document, documentResponseSchema);
            const response = successResponse(validatedData);
            return {
              status: 200,
              body: validateResponse(response, successResponseSchema(documentResponseSchema)),
            };
          },
        })
      )
    );
  }

  /**
   * Update document metadata
   * Refactored to use Effect-based service with functional error handling
   * Maps ServiceError to HttpError at boundary
   */
  static async updateDocument(id: number, metadataTags?: string[]) {
    return Effect.runPromise(
      pipe(
        DocumentService.updateDocument(id, metadataTags),
        Effect.provide(AppLayer),
        // Map ServiceError to HttpError at boundary
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (document: Document) => {
            const validatedData = validateResponse(document, updateDocumentResponseSchema);
            const response = successResponse(validatedData, "Document updated successfully");
            return {
              status: 200,
              body: validateResponse(response, successResponseSchema(updateDocumentResponseSchema)),
            };
          },
        })
      )
    );
  }

  /**
   * Delete document
   * Refactored to use Effect-based service with functional error handling
   * Maps ServiceError to HttpError at boundary
   */
  static async deleteDocument(id: number) {
    return Effect.runPromise(
      pipe(
        DocumentService.deleteDocument(id),
        Effect.provide(AppLayer),
        // Map ServiceError to HttpError at boundary
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (document: Document) => {
            const responseData = {
              id: document.id,
              filename: document.filename,
            };
            const validatedData = validateResponse(responseData, deleteDocumentResponseSchema);
            const response = successResponse(validatedData, "Document deleted successfully");
            return {
              status: 200,
              body: validateResponse(response, successResponseSchema(deleteDocumentResponseSchema)),
            };
          },
        })
      )
    );
  }

  /**
   * Search documents by metadata tags
   * Refactored to use Effect-based service with functional error handling
   * Maps ServiceError to HttpError at boundary
   */
  static async searchDocumentsByTags(searchTags: string[]) {
    return Effect.runPromise(
      pipe(
        DocumentService.searchDocumentsByTags(searchTags),
        Effect.provide(AppLayer),
        // Map ServiceError to HttpError at boundary
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (documents: Document[]) => {
            const responseData = {
              documents,
              count: documents.length,
              searchTags,
            };
            const validatedData = validateResponse(responseData, searchDocumentsResponseSchema);
            const response = successResponse(
              validatedData,
              `Found ${documents.length} document(s) matching the search criteria`
            );
            return {
              status: 200,
              body: validateResponse(response, successResponseSchema(searchDocumentsResponseSchema)),
            };
          },
        })
      )
    );
  }

  /**
   * Generate a short-lived download link for a document
   * Refactored to use Effect-based service with functional error handling
   * Maps ServiceError to HttpError at boundary
   */
  static async generateDownloadLink(documentId: number) {
    return Effect.runPromise(
      pipe(
        DocumentService.generateDownloadLink(documentId),
        Effect.provide(AppLayer),
        // Map ServiceError to HttpError at boundary
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (downloadLink) => {
            const responseData = {
              downloadUrl: downloadLink.downloadUrl,
              token: downloadLink.token,
              expiresAt: downloadLink.expiresAt,
              expiresInMinutes: config.downloadLinkExpiryMinutes,
              documentId: downloadLink.document.id,
              originalFilename: downloadLink.document.originalFilename,
            };
            const validatedData = validateResponse(responseData, downloadLinkResponseSchema);
            const response = successResponse(validatedData, "Download link generated successfully");
            return {
              status: 200,
              body: validateResponse(response, successResponseSchema(downloadLinkResponseSchema)),
            };
          },
        })
      )
    );
  }

  /**
   * Download document using a token
   * Refactored to use Effect-based service with functional error handling
   * Maps ServiceError to HttpError at boundary
   */
  static async downloadDocumentByToken(token: string) {
    return Effect.runPromise(
      pipe(
        DocumentService.downloadDocumentByToken(token),
        Effect.provide(AppLayer),
        // Map ServiceError to HttpError at boundary
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
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
