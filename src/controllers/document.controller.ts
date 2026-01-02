import { DocumentService } from "../services/document.service";
import { successResponse, errorResponse } from "../utils/response";
import { config } from "../config/app";
import { HttpUtils } from "../utils/http.utils";
import { Effect } from "effect";
import { AppLayer } from "../effect/layers";


export class DocumentController {
  /**
   * Upload a PDF document
   */
  /**
   * Upload a PDF document
   * Refactored to use Effect-based service
   */
  static async uploadDocument(file: File, metadataTags?: string[]) {
    try {
      const document = await Effect.runPromise(
        Effect.provide(DocumentService.createDocument(file, metadataTags), AppLayer)
      );

      return {
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
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = Effect.runSync(HttpUtils.getStatusFromError(err));
      return {
        status,
        body: errorResponse(err.message),
      };
    }
  }

  /**
   * Get all documents
   * Refactored to use Effect-based service
   */
  static async getAllDocuments() {
    try {
      const documents = await Effect.runPromise(
        Effect.provide(DocumentService.getAllDocuments(), AppLayer)
      );

      return {
        status: 200,
        body: successResponse(documents),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = Effect.runSync(HttpUtils.getStatusFromError(err));
      return {
        status,
        body: errorResponse(err.message),
      };
    }
  }

  /**
   * Get document by ID
   * Refactored to use Effect-based service
   */
  static async getDocumentById(id: number) {
    try {
      const document = await Effect.runPromise(
        Effect.provide(DocumentService.getDocumentById(id), AppLayer)
      );

      return {
        status: 200,
        body: successResponse(document),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = Effect.runSync(HttpUtils.getStatusFromError(err));
      return {
        status,
        body: errorResponse(err.message),
      };
    }
  }

  /**
   * Update document metadata
   * Refactored to use Effect-based service
   */
  static async updateDocument(id: number, metadataTags?: string[]) {
    try {
      const document = await Effect.runPromise(
        Effect.provide(DocumentService.updateDocument(id, metadataTags), AppLayer)
      );

      return {
        status: 200,
        body: successResponse(document, "Document updated successfully"),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = Effect.runSync(HttpUtils.getStatusFromError(err));
      return {
        status,
        body: errorResponse(err.message),
      };
    }
  }

  /**
   * Delete document
   * Refactored to use Effect-based service
   */
  static async deleteDocument(id: number) {
    try {
      const document = await Effect.runPromise(
        Effect.provide(DocumentService.deleteDocument(id), AppLayer)
      );

      return {
        status: 200,
        body: successResponse(
          {
            id: document.id,
            filename: document.filename,
          },
          "Document deleted successfully"
        ),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = Effect.runSync(HttpUtils.getStatusFromError(err));
      return {
        status,
        body: errorResponse(err.message),
      };
    }
  }

  /**
   * Search documents by metadata tags
   * Refactored to use Effect-based service
   */
  static async searchDocumentsByTags(searchTags: string[]) {
    try {
      const documents = await Effect.runPromise(
        Effect.provide(DocumentService.searchDocumentsByTags(searchTags), AppLayer)
      );

      return {
        status: 200,
        body: successResponse(
          {
            documents,
            count: documents.length,
            searchTags,
          },
          `Found ${documents.length} document(s) matching the search criteria`
        ),
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = Effect.runSync(HttpUtils.getStatusFromError(err));
      return {
        status,
        body: errorResponse(err.message),
      };
    }
  }

  /**
   * Generate a short-lived download link for a document
   * Refactored to use Effect-based service
   */
  static async generateDownloadLink(documentId: number) {
    try {
      const downloadLink = await Effect.runPromise(
        Effect.provide(DocumentService.generateDownloadLink(documentId), AppLayer)
      );

      return {
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
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = Effect.runSync(HttpUtils.getStatusFromError(err));
      return {
        status,
        body: errorResponse(err.message),
      };
    }
  }

  /**
   * Download document using a token
   * Refactored to use Effect-based service
   */
  static async downloadDocumentByToken(token: string) {
    try {
      const downloadData = await Effect.runPromise(
        Effect.provide(DocumentService.downloadDocumentByToken(token), AppLayer)
      );

      // Return file for download
      const file = Bun.file(downloadData.filePath);

      return new Response(file, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${downloadData.document.originalFilename}"`,
          "Content-Length": downloadData.document.fileSize.toString(),
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const status = Effect.runSync(HttpUtils.getStatusFromError(err));
      return {
        status,
        body: errorResponse(err.message),
      };
    }
  }
  
}
