import { DocumentService } from "../services/document.service";
import { successResponse, errorResponse } from "../utils/response";
import { config } from "../config/app";

// Helper to map error messages to HTTP status codes
const getStatusFromError = (error: Error): number => {
  const message = error.message.toLowerCase();
  
  if (message.includes("not found")) return 404;
  if (message.includes("only pdf") || message.includes("size") || message.includes("required")) return 400;
  return 500;
};


export class DocumentController {
  /**
   * Upload a PDF document
   */
  static async uploadDocument(file: File, metadataTags?: string[]) {
    const result = await DocumentService.createDocument(file, metadataTags);
    
    if (!result.ok) {
      return {
        status: getStatusFromError(result.error),
        body: errorResponse(result.error.message),
      };
    }
  
    return {
      status: 201,
      body: successResponse(
        {
          id: result.value.id,
          filename: result.value.filename,
          originalFilename: result.value.originalFilename,
          fileSize: result.value.fileSize,
          metadataTags: metadataTags || [],
          createdAt: result.value.createdAt,
        },
        "Document uploaded successfully"
      ),
    };
  }

  /**
   * Get all documents
   */
  static async getAllDocuments() {
    const result = await DocumentService.getAllDocuments();
    
    if (!result.ok) {
      return {
        status: getStatusFromError(result.error),
        body: errorResponse(result.error.message),
      };
    }
  
    return {
      status: 200,
      body: successResponse(result.value),
    };
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(id: number) {
    const result = await DocumentService.getDocumentById(id);
    
    if (!result.ok) {
      return {
        status: getStatusFromError(result.error),
        body: errorResponse(result.error.message),
      };
    }
  
    return {
      status: 200,
      body: successResponse(result.value),
    };
  }

  /**
   * Update document metadata
   */
  static async updateDocument(id: number, metadataTags?: string[]) {
    const result = await DocumentService.updateDocument(id, metadataTags);
    
    if (!result.ok) {
      return {
        status: getStatusFromError(result.error),
        body: errorResponse(result.error.message),
      };
    }
  
    return {
      status: 200,
      body: successResponse(result.value, "Document updated successfully"),
    };
  }

  /**
   * Delete document
   */
  static async deleteDocument(id: number) {
    const result = await DocumentService.deleteDocument(id);
    
    if (!result.ok) {
      return {
        status: getStatusFromError(result.error),
        body: errorResponse(result.error.message),
      };
    }
  
    return {
      status: 200,
      body: successResponse(
        {
          id: result.value.id,
          filename: result.value.filename,
        },
        "Document deleted successfully"
      ),
    };
  }

  /**
   * Search documents by metadata tags
   */
  static async searchDocumentsByTags(searchTags: string[]) {
    const result = await DocumentService.searchDocumentsByTags(searchTags);
    
    if (!result.ok) {
      return {
        status: getStatusFromError(result.error),
        body: errorResponse(result.error.message),
      };
    }
  
    return {
      status: 200,
      body: successResponse(
        {
          documents: result.value,
          count: result.value.length,
          searchTags,
        },
        `Found ${result.value.length} document(s) matching the search criteria`
      ),
    };
  }

  /**
   * Generate a short-lived download link for a document
   */
  static async generateDownloadLink(documentId: number) {
    const result = await DocumentService.generateDownloadLink(documentId);
    
    if (!result.ok) {
      return {
        status: getStatusFromError(result.error),
        body: errorResponse(result.error.message),
      };
    }
  
    return {
      status: 200,
      body: successResponse(
        {
          downloadUrl: result.value.downloadUrl,
          token: result.value.token,
          expiresAt: result.value.expiresAt,
          expiresInMinutes: config.downloadLinkExpiryMinutes,
          documentId: result.value.document.id,
          originalFilename: result.value.document.originalFilename,
        },
        "Download link generated successfully"
      ),
    };
  }

  /**
   * Download document using a token
   */
  static async downloadDocumentByToken(token: string) {
    const result = await DocumentService.downloadDocumentByToken(token);
    
    if (!result.ok) {
      return {
        status: getStatusFromError(result.error),
        body: errorResponse(result.error.message),
      };
    }
  
    // Return file for download
    const file = Bun.file(result.value.filePath);
  
    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.value.document.originalFilename}"`,
        "Content-Length": result.value.document.fileSize.toString(),
      },
    });
  }
  
}
