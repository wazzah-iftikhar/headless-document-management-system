/**
 * Document Persistence Factory
 * 
 * Creates test instances of persistence models for database operations.
 */

import type { DocumentPersistence } from "../../../domain/document/document.entity.schema";
import { generateTestUuid, generateTestDate, generateTestChecksum } from "../../utils";

export interface DocumentPersistenceFactoryOptions {
  id?: string;
  filename?: string;
  originalFilename?: string;
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  metadataTags?: string | string[]; // Can be JSON string or array
  createdAt?: string;
  updatedAt?: string;
  index?: number;
}

/**
 * Create a DocumentPersistence model with test data
 */
export function createDocumentPersistence(
  options: DocumentPersistenceFactoryOptions = {}
): DocumentPersistence {
  const index = options.index ?? 0;
  const id = options.id ?? generateTestUuid(index);
  const now = generateTestDate(index).toISOString();
  
  // Handle metadataTags - convert array to JSON string if needed
  let metadataTags: string;
  if (Array.isArray(options.metadataTags)) {
    metadataTags = JSON.stringify(options.metadataTags);
  } else if (options.metadataTags !== undefined) {
    metadataTags = options.metadataTags;
  } else {
    metadataTags = JSON.stringify([`tag-${index}`, "test"]);
  }
  
  return {
    id,
    filename: options.filename ?? `test-document-${index}.pdf`,
    originalFilename: options.originalFilename ?? `original-document-${index}.pdf`,
    filePath: options.filePath ?? `/documents/${id}/test-document-${index}.pdf`,
    fileSize: options.fileSize ?? 1024 * 100, // 100 KB
    checksum: options.checksum ?? generateTestChecksum(index),
    metadataTags,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Create multiple DocumentPersistence models
 */
export function createDocumentPersistenceList(
  count: number,
  baseOptions: DocumentPersistenceFactoryOptions = {}
): DocumentPersistence[] {
  return Array.from({ length: count }, (_, i) => 
    createDocumentPersistence({ ...baseOptions, index: i })
  );
}
