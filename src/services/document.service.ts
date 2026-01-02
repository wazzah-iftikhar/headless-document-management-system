import { DocumentRepository, DownloadTokenRepository } from "../repositories";
import { config } from "../config/app";
import { generateDownloadToken } from "../utils/token";
import type { Document } from "../models";
import type { DownloadToken } from "../models/download-token.model";
import { ok, err, type Result } from "../utils/result";
import { FileUtils } from "../utils/file.utils";
import { ValidationUtils } from "../utils/validation.utils";
import { Effect } from "effect";
import { AppLayer } from "../effect/layers";


export class DocumentService {
  
  static async createDocument(
    file: File,
    metadataTags?: string[]
  ): Promise<Result<Document>> {
    // Validate file
    const validatedFile = FileUtils.validateFile(file);
    if (!validatedFile.ok) return validatedFile;

    // Ensure directory exists
    const dirResult = await FileUtils.ensureUploadDirectory();
    if (!dirResult.ok) return dirResult;

    // Generate file path
    const pathResult = FileUtils.generateFilePath(validatedFile.value);
    if (!pathResult.ok) return pathResult;

    // Save file to disk
    const saveResult = await FileUtils.saveFileToDisk(validatedFile.value, pathResult.value.filePath);
    if (!saveResult.ok) return saveResult;
  
    // Save to database (using Effect)
    const createEffect = DocumentRepository.create({
      filename: pathResult.value.filename,
      originalFilename: validatedFile.value.name,
      filePath: pathResult.value.filePath,
      fileSize: validatedFile.value.size,
      metadataTags: JSON.stringify(metadataTags || []),
    });

    // Run Effect with AppLayer and convert to Result
    try {
      const document = await Effect.runPromise(
        Effect.provide(createEffect, AppLayer)
      );
      return ok(document);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }

  }


  static async getAllDocuments(): Promise<Result<Document[]>> {
  const result = await DocumentRepository.findAll();
  
  if (!result.ok) {
    return err(result.error);
  }

  // Format documents (parse metadataTags from JSON)
  const formattedDocuments = result.value.map((doc) => ({
    ...doc,
    metadataTags: doc.metadataTags ? JSON.parse(doc.metadataTags) : [],
  }));

  return ok(formattedDocuments);

}

  static async getDocumentById(id: number): Promise<Result<Document>> {
  const result = await DocumentRepository.findById(id);
  
  if (!result.ok) {
    return err(result.error);
  }

  // Format document (parse metadataTags from JSON)
  const formattedDocument = {
    ...result.value,
    metadataTags: result.value.metadataTags
      ? JSON.parse(result.value.metadataTags)
      : [],
  };

  return ok(formattedDocument);
}

static async updateDocument(
  id: number,
  metadataTags?: string[]
): Promise<Result<Document>> {
  // Build update data - only include metadataTags if provided
  const updateData: { metadataTags?: string } = {};
  if (metadataTags !== undefined) {
    updateData.metadataTags = JSON.stringify(metadataTags);
  }

  // Update document (repository handles "not found" as error)
  const result = await DocumentRepository.update(id, updateData);
  
  if (!result.ok) {
    return err(result.error);
  }

  // Format document (parse metadataTags from JSON)
  const formattedDocument = {
    ...result.value,
    metadataTags: result.value.metadataTags
      ? JSON.parse(result.value.metadataTags)
      : [],
  };

  return ok(formattedDocument);
}


  static async deleteDocument(id: number): Promise<Result<Document>> {
  // Get document first (to return it after deletion)
  const documentResult = await DocumentRepository.findById(id);
  if (!documentResult.ok) {
    return err(documentResult.error);
  }

  // Delete file from disk (non-critical - log warning if fails but continue)
  const fileDeleteResult = await FileUtils.deleteFileFromDisk(documentResult.value.filePath);
  if (!fileDeleteResult.ok) {
    console.warn("File deletion warning:", fileDeleteResult.error.message);
    // Continue with database deletion even if file deletion fails
  }

  // Delete from database
  const deleteResult = await DocumentRepository.delete(id);
  if (!deleteResult.ok) {
    return err(deleteResult.error);
  }

  // Return the deleted document
  return ok(documentResult.value);
}


static async searchDocumentsByTags(searchTags: string[]): Promise<Result<Document[]>> {
  // Validate search tags
  const validatedTags = ValidationUtils.validateSearchTags(searchTags);
  if (!validatedTags.ok) {
    return err(validatedTags.error);
  }

  // Search documents by tags
  const result = await DocumentRepository.findByTags(validatedTags.value);
  if (!result.ok) {
    return err(result.error);
  }

  // Format documents (parse metadataTags from JSON)
  const formattedDocuments = result.value.map((doc) => ({
    ...doc,
    metadataTags: doc.metadataTags ? JSON.parse(doc.metadataTags) : [],
  }));

  return ok(formattedDocuments);
}


static async generateDownloadLink(documentId: number): Promise<Result<{
  token: string;
  expiresAt: string;
  downloadUrl: string;
  document: Document;
}>> {
  // Check if document exists
  const documentResult = await DocumentRepository.findById(documentId);
  if (!documentResult.ok) {
    return err(documentResult.error);
  }

  // Generate secure token
  const token = generateDownloadToken();

  // Calculate expiration time
  const expiresAt = new Date();
  expiresAt.setMinutes(
    expiresAt.getMinutes() + config.downloadLinkExpiryMinutes
  );

  // Save token to database
  const tokenResult = await DownloadTokenRepository.create({
    token,
    documentId,
    expiresAt: expiresAt.toISOString(),
  });

  if (!tokenResult.ok) {
    return err(tokenResult.error);
  }

  const downloadUrl = `/documents/download/${token}`;

  return ok({
    token,
    expiresAt: tokenResult.value.expiresAt,
    downloadUrl,
    document: documentResult.value,
  });
}


static async downloadDocumentByToken(token: string): Promise<Result<{
  document: Document;
  filePath: string;
}>> {
  // Find valid token
  const tokenResult = await DownloadTokenRepository.findValidToken(token);
  if (!tokenResult.ok) {
    return err(tokenResult.error);
  }

  // Get document
  const documentResult = await DocumentRepository.findById(tokenResult.value.documentId);
  if (!documentResult.ok) {
    return err(documentResult.error);
  }

  // Check if file exists
  const fileCheckResult = await FileUtils.checkFileExists(documentResult.value.filePath);
  if (!fileCheckResult.ok) {
    return err(fileCheckResult.error);
  }

  // Mark token as used (non-critical - log warning if fails but continue)
  const markUsedResult = await DownloadTokenRepository.markAsUsed(tokenResult.value.id);
  if (!markUsedResult.ok) {
    console.warn("Failed to mark token as used:", markUsedResult.error.message);
    // Continue anyway - token is still valid for download
  }

  return ok({
    document: documentResult.value,
    filePath: documentResult.value.filePath,
  });
}
}

