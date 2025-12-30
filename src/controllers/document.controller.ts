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
}
