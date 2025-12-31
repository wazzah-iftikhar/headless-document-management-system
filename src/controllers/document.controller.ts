import { DocumentService } from "../services/document.service";
import { successResponse, errorResponse } from "../utils/response";
import { config } from "../config/app";

export class DocumentController {
  /**
   * Upload a PDF document
   */
  static async uploadDocument(file: File, metadataTags?: string[]) {
    try {
      const document = await DocumentService.createDocument(file, metadataTags);

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
      const message =
        error instanceof Error ? error.message : "Failed to upload document";
      const status = message.includes("Only PDF") || message.includes("size")
        ? 400
        : 500;

      return {
        status,
        body: errorResponse(message),
      };
    }
  }

  /**
   * Get all documents
   */
  static async getAllDocuments() {
    try {
      const documents = await DocumentService.getAllDocuments();

      const formattedDocuments = documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        originalFilename: doc.originalFilename,
        fileSize: doc.fileSize,
        metadataTags: doc.metadataTags ? JSON.parse(doc.metadataTags) : [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));

      return {
        status: 200,
        body: successResponse(formattedDocuments),
      };
    } catch (error) {
      console.error("Get documents error:", error);
      return {
        status: 500,
        body: errorResponse("Failed to fetch documents", error),
      };
    }
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(id: number) {
    try {
      const document = await DocumentService.getDocumentById(id);

      return {
        status: 200,
        body: successResponse({
          id: document.id,
          filename: document.filename,
          originalFilename: document.originalFilename,
          fileSize: document.fileSize,
          metadataTags: document.metadataTags
            ? JSON.parse(document.metadataTags)
            : [],
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
        }),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch document";
      const status = message.includes("not found") ? 404 : 500;

      return {
        status,
        body: errorResponse(message),
      };
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocument(id: number, metadataTags?: string[]) {
    try {
      const document = await DocumentService.updateDocument(id, metadataTags);

      return {
        status: 200,
        body: successResponse(
          {
            id: document.id,
            filename: document.filename,
            originalFilename: document.originalFilename,
            fileSize: document.fileSize,
            metadataTags: document.metadataTags
              ? JSON.parse(document.metadataTags)
              : [],
            createdAt: document.createdAt,
            updatedAt: document.updatedAt,
          },
          "Document updated successfully"
        ),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update document";
      const status = message.includes("not found") ? 404 : 500;

      return {
        status,
        body: errorResponse(message),
      };
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(id: number) {
    try {
      const document = await DocumentService.deleteDocument(id);

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
      const message =
        error instanceof Error ? error.message : "Failed to delete document";
      const status = message.includes("not found") ? 404 : 500;

      return {
        status,
        body: errorResponse(message),
      };
    }
  }

  /**
   * Search documents by metadata tags
   */
  static async searchDocumentsByTags(searchTags: string[]) {
    try {
      const documents = await DocumentService.searchDocumentsByTags(searchTags);

      const formattedDocuments = documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        originalFilename: doc.originalFilename,
        fileSize: doc.fileSize,
        metadataTags: doc.metadataTags ? JSON.parse(doc.metadataTags) : [],
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));

      return {
        status: 200,
        body: successResponse(
          {
            documents: formattedDocuments,
            count: formattedDocuments.length,
            searchTags,
          },
          `Found ${formattedDocuments.length} document(s) matching the search criteria`
        ),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to search documents";
      const status = message.includes("required") ? 400 : 500;

      return {
        status,
        body: errorResponse(message),
      };
    }
  }

  /**
   * Generate a short-lived download link for a document
   */
  static async generateDownloadLink(documentId: number) {
    try {
      const { token, expiresAt, downloadUrl, document } =
        await DocumentService.generateDownloadLink(documentId);

      return {
        status: 200,
        body: successResponse(
          {
            downloadUrl,
            token,
            expiresAt,
            expiresInMinutes: config.downloadLinkExpiryMinutes,
            documentId: document.id,
            originalFilename: document.originalFilename,
          },
          "Download link generated successfully"
        ),
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate download link";
      const status = message.includes("not found") ? 404 : 500;

      return {
        status,
        body: errorResponse(message),
      };
    }
  }

  /**
   * Download document using a token
   */
  static async downloadDocumentByToken(token: string) {
    try {
      const { document, filePath } =
        await DocumentService.downloadDocumentByToken(token);

      // Return file for download
      const file = Bun.file(filePath);

      return new Response(file, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${document.originalFilename}"`,
          "Content-Length": document.fileSize.toString(),
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to download document";
      const status = message.includes("Invalid") || message.includes("not found")
        ? 404
        : 500;

      return {
        status,
        body: errorResponse(message),
      };
    }
  }
}
