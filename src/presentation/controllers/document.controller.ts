import { Effect, pipe } from "effect";
import { AppLayer } from "../../effect/layers";
import { successResponse, errorResponse } from "../utils/response";
import type { HttpError } from "../errors/controller.errors";
import { mapUseCaseErrorToHttpError } from "./use-case-error-mapper";
import { httpErrorToStatus, mapServiceErrorToHttpError } from "../errors/controller.errors";
import { validateResponse } from "../middleware/schema-validator";
import {
  documentListResponseSchema,
  documentResponseSchema,
  updateDocumentResponseSchema,
  successResponseSchema,
  uploadDocumentResponseSchema,
  deleteDocumentResponseSchema,
  downloadLinkResponseSchema,
} from "../validations/document.schema";

// Import new use cases
import { GetDocumentUseCase } from "../../application/use-cases/document-queries.use-case";
import { ListDocumentsUseCase } from "../../application/use-cases/document-queries.use-case";
import { UpdateDocumentMetadataUseCase } from "../../application/use-cases/document-operations.use-case";

// Import DTOs
import type {
  GetDocumentQuery,
  ListDocumentsQuery,
  UpdateDocumentMetadataCommand,
} from "../../application/dtos/document.dtos";

// Import old service for backward compatibility (upload, delete, download)
import { DocumentService } from "../../services/document.service";
import { config } from "../../config/app";

/**
 * Document Controller (Updated to use new use cases)
 * 
 * Maps HTTP requests to use case commands/queries and use case results to HTTP responses.
 * This is the boundary between HTTP layer and application layer.
 */
export class DocumentController {

  /**
   * Get all documents
   * Uses new ListDocumentsUseCase
   */
  static async getAllDocuments() {
    const useCase = new ListDocumentsUseCase();
    const query: ListDocumentsQuery = {
      page: 1,
      limit: 1000, // Get all documents
    };

    return Effect.runPromise(
      pipe(
        useCase.execute(query),
        Effect.provide(AppLayer),
        Effect.mapError((useCaseError) => mapUseCaseErrorToHttpError(useCaseError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (result) => {
            // Map paginated result to response format
            const responseData = result.documents.map((doc) => ({
              id: doc.id,
              filename: doc.filename,
              originalFilename: doc.originalFilename,
              fileSize: doc.fileSize,
              metadataTags: doc.metadataTags,
              createdAt: doc.createdAt,
            }));
            const validatedData = validateResponse(responseData, documentListResponseSchema);
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
   * Uses new GetDocumentUseCase
   */
  static async getDocumentById(id: string) {
    const useCase = new GetDocumentUseCase();
    const query: GetDocumentQuery = { documentId: id };

    return Effect.runPromise(
      pipe(
        useCase.execute(query),
        Effect.provide(AppLayer),
        Effect.mapError((useCaseError) => mapUseCaseErrorToHttpError(useCaseError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (document) => {
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
   * Uses new UpdateDocumentMetadataUseCase
   */
  static async updateDocument(id: string, metadataTags?: string[]) {
    const useCase = new UpdateDocumentMetadataUseCase();
    const command: UpdateDocumentMetadataCommand = {
      documentId: id,
      metadataTags,
    };

    return Effect.runPromise(
      pipe(
        useCase.execute(command),
        Effect.provide(AppLayer),
        Effect.mapError((useCaseError) => mapUseCaseErrorToHttpError(useCaseError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (document) => {
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
   * Search documents by tags
   * Uses new ListDocumentsUseCase with tags filter
   */
  static async searchDocumentsByTags(searchTags: string[]) {
    const useCase = new ListDocumentsUseCase();
    const query: ListDocumentsQuery = {
      tags: searchTags,
      page: 1,
      limit: 1000,
    };

    return Effect.runPromise(
      pipe(
        useCase.execute(query),
        Effect.provide(AppLayer),
        Effect.mapError((useCaseError) => mapUseCaseErrorToHttpError(useCaseError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (result) => {
            const responseData = {
              documents: result.documents.map((doc) => ({
                id: doc.id,
                filename: doc.filename,
                originalFilename: doc.originalFilename,
                fileSize: doc.fileSize,
                metadataTags: doc.metadataTags,
                createdAt: doc.createdAt,
              })),
              count: result.documents.length,
              searchTags,
            };
            const validatedData = validateResponse(responseData, documentListResponseSchema);
            const response = successResponse(
              validatedData,
              `Found ${result.documents.length} document(s) matching the search criteria`
            );
            return {
              status: 200,
              body: validateResponse(response, successResponseSchema(documentListResponseSchema)),
            };
          },
        })
      )
    );
  }

  // Keep old methods for backward compatibility (upload, delete, download)
  // These will be migrated to use cases in a future update
  // For now, they still use DocumentService
  static async uploadDocument(file: File, metadataTags?: string[]) {
    // TODO: Migrate to use cases (CreateDocumentUseCase + InitiateUploadUseCase + ConfirmUploadUseCase)
    // For now, keep using DocumentService for direct file upload
    return Effect.runPromise(
      pipe(
        DocumentService.createDocument(file, metadataTags),
        Effect.provide(AppLayer),
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (document) => {
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

  static async deleteDocument(id: string) {
    // TODO: Migrate to use case
    return Effect.runPromise(
      pipe(
        DocumentService.deleteDocument(id),
        Effect.provide(AppLayer),
        Effect.mapError((serviceError) => mapServiceErrorToHttpError(serviceError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return {
              status,
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (document) => {
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

  static async generateDownloadLink(documentId: string) {
    // TODO: Migrate to use case
    return Effect.runPromise(
      pipe(
        DocumentService.generateDownloadLink(documentId),
        Effect.provide(AppLayer),
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

  static async downloadDocumentByToken(token: string) {
    // TODO: Migrate to use case
    return Effect.runPromise(
      pipe(
        DocumentService.downloadDocumentByToken(token),
        Effect.provide(AppLayer),
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
