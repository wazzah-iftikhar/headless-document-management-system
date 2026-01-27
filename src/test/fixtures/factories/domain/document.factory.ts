/**
 * Document Domain Entity Factory
 * 
 * Creates test instances of DocumentDomain entities with realistic, deterministic data.
 */

import type { DocumentDomain } from "../../../domain/document/document.entity.schema";
import { generateTestUuid, generateTestDate, generateTestChecksum } from "../../utils";

export interface DocumentFactoryOptions {
  id?: string;
  filename?: string;
  originalFilename?: string;
  filePath?: string;
  fileSize?: number;
  checksum?: string;
  metadataTags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  index?: number; // For deterministic generation
}

/**
 * Create a DocumentDomain entity with test data
 */
export function createDocumentDomain(options: DocumentFactoryOptions = {}): DocumentDomain {
  const index = options.index ?? 0;
  const id = options.id ?? generateTestUuid(index);
  const now = generateTestDate(index);
  
  return {
    id,
    fileReference: {
      filename: options.filename ?? `test-document-${index}.pdf`,
      originalFilename: options.originalFilename ?? `original-document-${index}.pdf`,
      filePath: options.filePath ?? `/documents/${id}/test-document-${index}.pdf`,
    },
    fileSize: options.fileSize ?? 1024 * 100, // 100 KB default
    checksum: options.checksum ?? generateTestChecksum(index),
    metadataTags: options.metadataTags ?? [`tag-${index}`, "test"],
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Create multiple DocumentDomain entities
 */
export function createDocumentDomains(count: number, baseOptions: DocumentFactoryOptions = {}): DocumentDomain[] {
  return Array.from({ length: count }, (_, i) => 
    createDocumentDomain({ ...baseOptions, index: i })
  );
}

/**
 * Create a document in draft status
 */
export function createDraftDocument(options: DocumentFactoryOptions = {}): DocumentDomain {
  return createDocumentDomain({
    ...options,
    metadataTags: [...(options.metadataTags ?? []), "status:draft"],
  });
}

/**
 * Create a document in published status
 */
export function createPublishedDocument(options: DocumentFactoryOptions = {}): DocumentDomain {
  return createDocumentDomain({
    ...options,
    metadataTags: [...(options.metadataTags ?? []), "status:published"],
  });
}

/**
 * Create a document in archived status
 */
export function createArchivedDocument(options: DocumentFactoryOptions = {}): DocumentDomain {
  return createDocumentDomain({
    ...options,
    metadataTags: [...(options.metadataTags ?? []), "status:archived"],
  });
}
