import { DocumentRepository, DownloadTokenRepository } from "../repositories";
import { config } from "../config/app";
import { generateDownloadToken } from "../utils/token";
import type { Document } from "../models";
import type { DownloadToken } from "../models/download-token.model";
import { ok, err, type Result, tryAsync } from "../utils/result";


const validateFile = (file: File): Result<File> => {
  if (file.type !== "application/pdf") {
    return err(new Error("Only PDF files are allowed"));
  }
  if (file.size > config.maxFileSize) {
    return err(
      new Error(
        `File size exceeds maximum allowed size of ${config.maxFileSize / 1024 / 1024}MB`
      )
    );
  }
  return ok(file);
};


const ensureUploadDirectory = async (): Promise<Result<void>> => {
  return tryAsync(async () => {
    const uploadDir = Bun.file(config.uploadPath);
    if (!(await uploadDir.exists())) {
      await Bun.$`mkdir -p ${config.uploadPath}`;
    }
  });
};


const generateFilePath = (file: File): Result<{ filePath: string; filename: string }> => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${randomSuffix}.pdf`;
  const filePath = `${config.uploadPath}/${filename}`;
  return ok({ filePath, filename });
};


const saveFileToDisk = async (file: File, filePath: string): Promise<Result<void>> => {
  return tryAsync(async () => {
    await Bun.write(filePath, await file.arrayBuffer());
  });
};


const deleteFileFromDisk = async (filePath: string): Promise<Result<void>> => {
  return tryAsync(async () => {
    const file = Bun.file(filePath);
    if (await file.exists()) {
      await Bun.write(filePath, new Uint8Array(0));
      const fileHandle = await Bun.file(filePath);
      if (await fileHandle.exists()) {
        await Bun.$`rm -f ${filePath}`.quiet();
      }
    }
  });
};

const validateSearchTags = (searchTags: string[]): Result<string[]> => {
  if (!searchTags || searchTags.length === 0) {
    return err(new Error("At least one tag is required for search"));
  }
  return ok(searchTags);
};


const checkFileExists = async (filePath: string): Promise<Result<void>> => {
  return tryAsync(async () => {
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      throw new Error("File not found on server");
    }
  });
};


export class DocumentService {
  
    static async createDocument(
      file: File,
      metadataTags?: string[]
  ): Promise<Result<Document>> {
    // Validate file
    const validatedFile = validateFile(file);
    if (!validatedFile.ok) return validatedFile;
  
    // Ensure directory exists
    const dirResult = await ensureUploadDirectory();
    if (!dirResult.ok) return dirResult;
  
    // Generate file path
    const pathResult = generateFilePath(validatedFile.value);
    if (!pathResult.ok) return pathResult;
  
    // Save file to disk
    const saveResult = await saveFileToDisk(validatedFile.value, pathResult.value.filePath);
    if (!saveResult.ok) return saveResult;
  
    // Save to database
    return await DocumentRepository.create({
      filename: pathResult.value.filename,
      originalFilename: validatedFile.value.name,
      filePath: pathResult.value.filePath,
      fileSize: validatedFile.value.size,
      metadataTags: JSON.stringify(metadataTags || []),
    });

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
  const fileDeleteResult = await deleteFileFromDisk(documentResult.value.filePath);
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
  const validatedTags = validateSearchTags(searchTags);
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
  const fileCheckResult = await checkFileExists(documentResult.value.filePath);
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

