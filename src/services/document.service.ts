import { DocumentRepository, DownloadTokenRepository } from "../repositories";
import { config } from "../config/app";
import { generateDownloadToken } from "../utils/token";
import type { Document } from "../models";
import type { DownloadToken } from "../models/download-token.model";

export class DocumentService {
  static async createDocument(
    file: File,
    metadataTags?: string[]
  ): Promise<Document> {
    // File validation
    if (file.type !== "application/pdf") {
      throw new Error("Only PDF files are allowed");
    }

    if (file.size > config.maxFileSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${config.maxFileSize / 1024 / 1024}MB`
      );
    }

    // File operations
    const uploadDir = Bun.file(config.uploadPath);
    if (!(await uploadDir.exists())) {
      await Bun.$`mkdir -p ${config.uploadPath}`;
    }

    const timestamp = Date.now();
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${sanitizedOriginalName}`;
    const filePath = `${config.uploadPath}/${filename}`;

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    await Bun.write(filePath, arrayBuffer);

    // Save to database via repository
    const document = await DocumentRepository.create({
      filename,
      originalFilename: file.name,
      filePath,
      fileSize: file.size,
      metadataTags: JSON.stringify(metadataTags || []),
    });

    return document;
  }

  static async getAllDocuments(): Promise<Document[]> {
    return await DocumentRepository.findAll();
  }

  static async getDocumentById(id: number): Promise<Document> {
    const document = await DocumentRepository.findById(id);
    if (!document) {
      throw new Error("Document not found");
    }
    return document;
  }

  static async updateDocument(
    id: number,
    metadataTags?: string[]
  ): Promise<Document> {
    // Check if document exists
    const existingDocument = await DocumentRepository.findById(id);
    if (!existingDocument) {
      throw new Error("Document not found");
    }

    const updateData: { metadataTags?: string } = {};
    if (metadataTags !== undefined) {
      updateData.metadataTags = JSON.stringify(metadataTags);
    }

    return await DocumentRepository.update(id, updateData);
  }

  static async deleteDocument(id: number): Promise<Document> {
    const document = await DocumentRepository.findById(id);
    if (!document) {
      throw new Error("Document not found");
    }

    // Delete file from disk
    try {
      const file = Bun.file(document.filePath);
      if (await file.exists()) {
        await Bun.write(document.filePath, new Uint8Array(0));
        const fileHandle = await Bun.file(document.filePath);
        if (await fileHandle.exists()) {
          await Bun.$`rm -f ${document.filePath}`.quiet();
        }
      }
    } catch (fileError) {
      console.warn("File deletion warning:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    await DocumentRepository.delete(id);
    return document;
  }

  static async searchDocumentsByTags(searchTags: string[]): Promise<Document[]> {
    if (!searchTags || searchTags.length === 0) {
      throw new Error("At least one tag is required for search");
    }

    return await DocumentRepository.findByTags(searchTags);
  }

  static async generateDownloadLink(documentId: number): Promise<{
    token: string;
    expiresAt: string;
    downloadUrl: string;
    document: Document;
  }> {
    // Check if document exists
    const document = await DocumentRepository.findById(documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Generate secure token
    const token = generateDownloadToken();

    // Calculate expiration time
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + config.downloadLinkExpiryMinutes
    );

    // Save token to database
    const downloadToken = await DownloadTokenRepository.create({
      token,
      documentId,
      expiresAt: expiresAt.toISOString(),
    });

    const downloadUrl = `/documents/download/${token}`;

    return {
      token,
      expiresAt: downloadToken.expiresAt,
      downloadUrl,
      document,
    };
  }

  static async downloadDocumentByToken(token: string): Promise<{
    document: Document;
    filePath: string;
  }> {
    // Find valid token
    const tokenRecord = await DownloadTokenRepository.findValidToken(token);
    if (!tokenRecord) {
      throw new Error("Invalid or expired download link");
    }

    // Get document
    const document = await DocumentRepository.findById(tokenRecord.documentId);
    if (!document) {
      throw new Error("Document not found");
    }

    // Check if file exists
    const file = Bun.file(document.filePath);
    if (!(await file.exists())) {
      throw new Error("File not found on server");
    }

    // Mark token as used
    await DownloadTokenRepository.markAsUsed(tokenRecord.id);

    return {
      document,
      filePath: document.filePath,
    };
  }
}

