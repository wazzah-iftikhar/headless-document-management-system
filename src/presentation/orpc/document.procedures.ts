/**
 * oRPC Procedures for Document Management
 * 
 * Type-safe RPC procedures that directly consume application DTOs.
 * These procedures are thin wrappers that:
 * - Extract context (workspace, user) from headers
 * - Call use cases with DTOs
 * - Return results
 * 
 * Effect Schema DTOs are used directly as oRPC input/output schemas.
 * This ensures end-to-end type safety from client to use cases.
 */

import { os } from "@orpc/server";
import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import { AppLayer } from "../../effect/layers";
import type { UseCaseError } from "../../application/errors/use-case.errors";
import { useCases } from "../../application/composition-root";
import { extractContext } from "./context-extractor";
import {
  CreateDocumentCommandSchema,
  GetDocumentQuerySchema,
  ListDocumentsQuerySchema,
  UpdateDocumentMetadataCommandSchema,
  GenerateDownloadLinkQuerySchema,
  DownloadByTokenQuerySchema,
  DocumentResultSchema,
  DownloadLinkResultSchema,
  DownloadResultSchema,
} from "../../application/dtos/document.dtos";

/**
 * Create Document Procedure
 * Creates a document with metadata (no file upload)
 */
export const createDocument = os
  .input(CreateDocumentCommandSchema)
  .output(DocumentResultSchema)
  .handler(async ({ input, context }) => {
    const ctx = extractContext(context.headers || new Headers());
    
    return Effect.runPromise(
      pipe(
        useCases.createDocument.execute(input),
        Effect.provide(AppLayer),
        Effect.mapError((error: UseCaseError) => {
          return new Error(error.message || "Failed to create document");
        })
      )
    );
  });

/**
 * Get Document Procedure
 * Retrieves a document by ID
 */
export const getDocument = os
  .input(GetDocumentQuerySchema)
  .output(DocumentResultSchema)
  .handler(async ({ input, context }) => {
    const ctx = extractContext(context.headers || new Headers());
    
    return Effect.runPromise(
      pipe(
        useCases.getDocument.execute(input),
        Effect.provide(AppLayer),
        Effect.mapError((error: UseCaseError) => {
          if (error._tag === "DocumentNotFound") {
            throw new Error(`Document not found: ${error.documentId}`);
          }
          return new Error(error.message || "Failed to get document");
        })
      )
    );
  });

/**
 * List Documents Procedure
 * Lists all documents with pagination
 */
export const listDocuments = os
  .input(ListDocumentsQuerySchema)
  .output(Schema.Struct({
    documents: Schema.Array(DocumentResultSchema),
    count: Schema.Number,
    page: Schema.Number,
    limit: Schema.Number,
    totalPages: Schema.Number,
  }))
  .handler(async ({ input, context }) => {
    const ctx = extractContext(context.headers || new Headers());
    
    return Effect.runPromise(
      pipe(
        useCases.listDocuments.execute(input),
        Effect.provide(AppLayer),
        Effect.mapError((error: UseCaseError) => {
          return new Error(error.message || "Failed to list documents");
        })
      )
    );
  });

/**
 * Update Document Metadata Procedure
 * Updates document metadata (tags, etc.)
 */
export const updateDocumentMetadata = os
  .input(UpdateDocumentMetadataCommandSchema)
  .output(DocumentResultSchema)
  .handler(async ({ input, context }) => {
    const ctx = extractContext(context.headers || new Headers());
    
    return Effect.runPromise(
      pipe(
        useCases.updateDocumentMetadata.execute(input),
        Effect.provide(AppLayer),
        Effect.mapError((error: UseCaseError) => {
          if (error._tag === "DocumentNotFound") {
            throw new Error(`Document not found: ${error.documentId}`);
          }
          return new Error(error.message || "Failed to update document");
        })
      )
    );
  });

/**
 * Delete Document Procedure
 * Deletes a document
 */
export const deleteDocument = os
  .input(GetDocumentQuerySchema)
  .output(Schema.Struct({
    success: Schema.Boolean,
    message: Schema.String,
    documentId: Schema.String,
  }))
  .handler(async ({ input, context }) => {
    const ctx = extractContext(context.headers || new Headers());
    
    return Effect.runPromise(
      pipe(
        useCases.deleteDocument.execute(input),
        Effect.provide(AppLayer),
        Effect.mapError((error: UseCaseError) => {
          if (error._tag === "DocumentNotFound") {
            throw new Error(`Document not found: ${error.documentId}`);
          }
          return new Error(error.message || "Failed to delete document");
        }),
        Effect.map((result) => ({
          success: true,
          message: "Document deleted successfully",
          documentId: result.documentId,
        }))
      )
    );
  });

/**
 * Generate Download Link Procedure
 * Generates a secure download link for a document
 */
export const generateDownloadLink = os
  .input(GenerateDownloadLinkQuerySchema)
  .output(DownloadLinkResultSchema)
  .handler(async ({ input, context }) => {
    const ctx = extractContext(context.headers || new Headers());
    
    return Effect.runPromise(
      pipe(
        useCases.generateDownloadLink.execute(input),
        Effect.provide(AppLayer),
        Effect.mapError((error: UseCaseError) => {
          if (error._tag === "DocumentNotFound") {
            throw new Error(`Document not found: ${error.documentId}`);
          }
          return new Error(error.message || "Failed to generate download link");
        })
      )
    );
  });

/**
 * Download Document by Token Procedure
 * Downloads a document using a download token
 * 
 * Note: This returns metadata about the download.
 * The actual file download should be handled via HTTP endpoint.
 */
export const downloadByToken = os
  .input(DownloadByTokenQuerySchema)
  .output(DownloadResultSchema)
  .handler(async ({ input, context }) => {
    const ctx = extractContext(context.headers || new Headers());
    
    return Effect.runPromise(
      pipe(
        useCases.downloadByToken.execute(input),
        Effect.provide(AppLayer),
        Effect.mapError((error: UseCaseError) => {
          if (error._tag === "InvalidUploadToken") {
            throw new Error(`Invalid or expired download token: ${error.token}`);
          }
          return new Error(error.message || "Failed to download document");
        })
      )
    );
  });

/**
 * Document Router
 * Groups all document-related procedures
 */
export const documentRouter = {
  createDocument,
  getDocument,
  listDocuments,
  updateDocumentMetadata,
  deleteDocument,
  generateDownloadLink,
  downloadByToken,
};
