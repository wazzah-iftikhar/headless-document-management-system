import { db } from "../config/database";
import { documents } from "../models";
import { config } from "../config/app";
import { successResponse, errorResponse } from "../utils/response";
import { uploadDocumentSchema } from "../validations/document.schema";
import { eq } from "drizzle-orm";

export class DocumentController {
  /**
   * Upload a PDF document
   */
  static async uploadDocument(file: File, metadataTags?: string[]) {
    try {
      // Validate file type
      if (file.type !== "application/pdf") {
        return {
          status: 400,
          body: errorResponse("Only PDF files are allowed"),
        };
      }

      // Validate file size
      if (file.size > config.maxFileSize) {
        return {
          status: 400,
          body: errorResponse(
            `File size exceeds maximum allowed size of ${config.maxFileSize / 1024 / 1024}MB`
          ),
        };
      }

      // Ensure uploads directory exists
      const uploadDir = Bun.file(config.uploadPath);
      if (!(await uploadDir.exists())) {
        await Bun.$`mkdir -p ${config.uploadPath}`;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${timestamp}_${sanitizedOriginalName}`;
      const filePath = `${config.uploadPath}/${filename}`;

      // Save file to disk
      const arrayBuffer = await file.arrayBuffer();
      await Bun.write(filePath, arrayBuffer);

      // Parse metadata tags
      const tags = metadataTags || [];
      const metadataTagsJson = JSON.stringify(tags);

      // Save document metadata to database
      const [document] = await db
        .insert(documents)
        .values({
          filename,
          originalFilename: file.name,
          filePath,
          fileSize: file.size,
          metadataTags: metadataTagsJson,
        })
        .returning();

      if (!document) {
        return {
          status: 500,
          body: errorResponse("Failed to save document to database"),
        };
      }

      return {
        status: 201,
        body: successResponse(
          {
            id: document.id,
            filename: document.filename,
            originalFilename: document.originalFilename,
            fileSize: document.fileSize,
            metadataTags: tags,
            createdAt: document.createdAt,
          },
          "Document uploaded successfully"
        ),
      };
    } catch (error) {
      console.error("Upload error:", error);
      return {
        status: 500,
        body: errorResponse("Failed to upload document", error),
      };
    }
  }

  /**
   * Get all documents
   */
  static async getAllDocuments() {
    try {
      const allDocuments = await db.select().from(documents);

      const formattedDocuments = allDocuments.map((doc) => ({
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
      const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);

      if (!document) {
        return {
          status: 404,
          body: errorResponse("Document not found"),
        };
      }

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
      console.error("Get document error:", error);
      return {
        status: 500,
        body: errorResponse("Failed to fetch document", error),
      };
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocument(id: number, metadataTags?: string[]) {
    try {
      // Check if document exists
      const [existingDocument] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);

      if (!existingDocument) {
        return {
          status: 404,
          body: errorResponse("Document not found"),
        };
      }

      // Update metadata tags if provided
      const updateData: { metadataTags?: string; updatedAt: string } = {
        updatedAt: new Date().toISOString(),
      };

      if (metadataTags !== undefined) {
        updateData.metadataTags = JSON.stringify(metadataTags);
      }

      // Update document in database
      const [updatedDocument] = await db
        .update(documents)
        .set(updateData)
        .where(eq(documents.id, id))
        .returning();

      if (!updatedDocument) {
        return {
          status: 500,
          body: errorResponse("Failed to update document in database"),
        };
      }

      return {
        status: 200,
        body: successResponse(
          {
            id: updatedDocument.id,
            filename: updatedDocument.filename,
            originalFilename: updatedDocument.originalFilename,
            fileSize: updatedDocument.fileSize,
            metadataTags: updatedDocument.metadataTags
              ? JSON.parse(updatedDocument.metadataTags)
              : [],
            createdAt: updatedDocument.createdAt,
            updatedAt: updatedDocument.updatedAt,
          },
          "Document updated successfully"
        ),
      };
    } catch (error) {
      console.error("Update document error:", error);
      return {
        status: 500,
        body: errorResponse("Failed to update document", error),
      };
    }
  }

  /**
   * Delete document
   */
  static async deleteDocument(id: number) {
    try {
      // Check if document exists
      const [document] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, id))
        .limit(1);

      if (!document) {
        return {
          status: 404,
          body: errorResponse("Document not found"),
        };
      }

      // Delete file from disk
      try {
        const file = Bun.file(document.filePath);
        if (await file.exists()) {
          await Bun.write(document.filePath, new Uint8Array(0)); // Clear file
          // Use Bun's file system to remove the file
          const fileHandle = await Bun.file(document.filePath);
          if (await fileHandle.exists()) {
            await Bun.$`rm -f ${document.filePath}`.quiet();
          }
        }
      } catch (fileError) {
        console.warn("File deletion warning:", fileError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete document from database
      await db.delete(documents).where(eq(documents.id, id));

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
      console.error("Delete document error:", error);
      return {
        status: 500,
        body: errorResponse("Failed to delete document", error),
      };
    }
  }

  /**
   * Search documents by metadata tags
   */
  static async searchDocumentsByTags(searchTags: string[]) {
    try {
      if (!searchTags || searchTags.length === 0) {
        return {
          status: 400,
          body: errorResponse("At least one tag is required for search"),
        };
      }

      // Get all documents
      const allDocuments = await db.select().from(documents);

      // Filter documents that contain any of the search tags
      const matchingDocuments = allDocuments.filter((doc) => {
        if (!doc.metadataTags) return false;

        try {
          const docTags: string[] = JSON.parse(doc.metadataTags);
          // Check if any of the search tags exist in the document's tags
          return searchTags.some((searchTag) =>
            docTags.some(
              (docTag) =>
                docTag.toLowerCase() === searchTag.toLowerCase() ||
                docTag.toLowerCase().includes(searchTag.toLowerCase())
            )
          );
        } catch {
          return false;
        }
      });

      const formattedDocuments = matchingDocuments.map((doc) => ({
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
      console.error("Search documents error:", error);
      return {
        status: 500,
        body: errorResponse("Failed to search documents", error),
      };
    }
  }
}
