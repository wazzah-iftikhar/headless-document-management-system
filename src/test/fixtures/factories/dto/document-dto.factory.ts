/**
 * Document DTO Factory
 * 
 * Creates test instances of document-related DTOs (commands, queries, results).
 */

import type {
  CreateDocumentCommand,
  InitiateUploadCommand,
  ConfirmUploadCommand,
  PublishDocumentCommand,
  UpdateDocumentMetadataCommand,
  GetDocumentQuery,
  ListDocumentsQuery,
  DocumentResult,
  UploadInitiationResult,
  UploadConfirmationResult,
} from "../../../application/dtos/document.dtos";
import { generateTestUuid, generateTestDate, generateTestChecksum } from "../../utils";

// ============================================================================
// Command DTOs
// ============================================================================

export interface CreateDocumentCommandOptions {
  filename?: string;
  originalFilename?: string;
  metadataTags?: string[];
  index?: number;
}

export function createCreateDocumentCommand(
  options: CreateDocumentCommandOptions = {}
): CreateDocumentCommand {
  const index = options.index ?? 0;
  
  return {
    filename: options.filename ?? `test-document-${index}.pdf`,
    originalFilename: options.originalFilename ?? `original-document-${index}.pdf`,
    metadataTags: options.metadataTags ?? [`tag-${index}`, "test"],
  };
}

export interface InitiateUploadCommandOptions {
  documentId?: string;
  filename?: string;
  fileSize?: number;
  contentType?: string;
  index?: number;
}

export function createInitiateUploadCommand(
  options: InitiateUploadCommandOptions = {}
): InitiateUploadCommand {
  const index = options.index ?? 0;
  
  return {
    documentId: options.documentId ?? generateTestUuid(index),
    filename: options.filename ?? `test-document-${index}.pdf`,
    fileSize: options.fileSize ?? 1024 * 100, // 100 KB
    contentType: options.contentType ?? "application/pdf",
  };
}

export interface ConfirmUploadCommandOptions {
  documentId?: string;
  uploadToken?: string;
  checksum?: string;
  filePath?: string;
  fileSize?: number;
  index?: number;
}

export function createConfirmUploadCommand(
  options: ConfirmUploadCommandOptions = {}
): ConfirmUploadCommand {
  const index = options.index ?? 0;
  const documentId = options.documentId ?? generateTestUuid(index);
  
  return {
    documentId,
    uploadToken: options.uploadToken ?? `upload-token-${index}`,
    checksum: options.checksum ?? generateTestChecksum(index),
    filePath: options.filePath ?? `/documents/${documentId}/test-document-${index}.pdf`,
    fileSize: options.fileSize ?? 1024 * 100, // 100 KB
  };
}

export interface PublishDocumentCommandOptions {
  documentId?: string;
  status?: "draft" | "published" | "archived";
  index?: number;
}

export function createPublishDocumentCommand(
  options: PublishDocumentCommandOptions = {}
): PublishDocumentCommand {
  const index = options.index ?? 0;
  
  return {
    documentId: options.documentId ?? generateTestUuid(index),
    status: options.status ?? "published",
  };
}

export interface UpdateDocumentMetadataCommandOptions {
  documentId?: string;
  metadataTags?: string[];
  index?: number;
}

export function createUpdateDocumentMetadataCommand(
  options: UpdateDocumentMetadataCommandOptions = {}
): UpdateDocumentMetadataCommand {
  const index = options.index ?? 0;
  
  return {
    documentId: options.documentId ?? generateTestUuid(index),
    metadataTags: options.metadataTags ?? [`updated-tag-${index}`],
  };
}

// ============================================================================
// Query DTOs
// ============================================================================

export interface GetDocumentQueryOptions {
  documentId?: string;
  index?: number;
}

export function createGetDocumentQuery(
  options: GetDocumentQueryOptions = {}
): GetDocumentQuery {
  const index = options.index ?? 0;
  
  return {
    documentId: options.documentId ?? generateTestUuid(index),
  };
}

export interface ListDocumentsQueryOptions {
  page?: number;
  limit?: number;
  tags?: string[];
  status?: "draft" | "published" | "archived";
}

export function createListDocumentsQuery(
  options: ListDocumentsQueryOptions = {}
): ListDocumentsQuery {
  return {
    page: options.page ?? 1,
    limit: options.limit ?? 20,
    tags: options.tags,
    status: options.status,
  };
}

// ============================================================================
// Result DTOs
// ============================================================================

export interface DocumentResultOptions {
  id?: string;
  filename?: string;
  originalFilename?: string;
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  metadataTags?: string[];
  createdAt?: string;
  updatedAt?: string;
  index?: number;
}

export function createDocumentResult(
  options: DocumentResultOptions = {}
): DocumentResult {
  const index = options.index ?? 0;
  const id = options.id ?? generateTestUuid(index);
  const now = generateTestDate(index).toISOString();
  
  return {
    id,
    filename: options.filename ?? `test-document-${index}.pdf`,
    originalFilename: options.originalFilename ?? `original-document-${index}.pdf`,
    filePath: options.filePath ?? `/documents/${id}/test-document-${index}.pdf`,
    fileSize: options.fileSize ?? 1024 * 100,
    checksum: options.checksum ?? generateTestChecksum(index),
    metadataTags: options.metadataTags ?? [`tag-${index}`, "test"],
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

export interface UploadInitiationResultOptions {
  uploadToken?: string;
  uploadUrl?: string;
  expiresAt?: string;
  documentId?: string;
  index?: number;
}

export function createUploadInitiationResult(
  options: UploadInitiationResultOptions = {}
): UploadInitiationResult {
  const index = options.index ?? 0;
  const documentId = options.documentId ?? generateTestUuid(index);
  const expiresAt = options.expiresAt ?? generateTestDate(index + 1).toISOString();
  
  return {
    uploadToken: options.uploadToken ?? `upload-token-${index}`,
    uploadUrl: options.uploadUrl ?? `/upload/${documentId}`,
    expiresAt,
    documentId,
  };
}

export interface UploadConfirmationResultOptions {
  documentId?: string;
  versionNumber?: number;
  checksum?: string;
  filePath?: string;
  index?: number;
}

export function createUploadConfirmationResult(
  options: UploadConfirmationResultOptions = {}
): UploadConfirmationResult {
  const index = options.index ?? 0;
  const documentId = options.documentId ?? generateTestUuid(index);
  
  return {
    documentId,
    versionNumber: options.versionNumber ?? 1,
    checksum: options.checksum ?? generateTestChecksum(index),
    filePath: options.filePath ?? `/documents/${documentId}/test-document-${index}.pdf`,
  };
}
