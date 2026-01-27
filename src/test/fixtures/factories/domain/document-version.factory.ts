/**
 * DocumentVersion Domain Entity Factory
 * 
 * Creates test instances of DocumentVersionDomain entities with realistic, deterministic data.
 */

import type { DocumentVersionDomain } from "../../../domain/document/document-version.entity.schema";
import { generateTestUuid, generateTestDate } from "../../utils";

export interface DocumentVersionFactoryOptions {
  id?: string;
  documentId?: string;
  versionNumber?: number;
  createdAt?: Date;
  updatedAt?: Date;
  index?: number; // For deterministic generation
}

/**
 * Create a DocumentVersionDomain entity with test data
 */
export function createDocumentVersionDomain(options: DocumentVersionFactoryOptions = {}): DocumentVersionDomain {
  const index = options.index ?? 0;
  const id = options.id ?? generateTestUuid(index + 5000); // Use different seed range
  const now = generateTestDate(index);
  
  return {
    id,
    documentId: options.documentId ?? generateTestUuid(index),
    versionNumber: options.versionNumber ?? index + 1,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
  };
}

/**
 * Create multiple DocumentVersionDomain entities
 */
export function createDocumentVersionDomains(
  count: number,
  baseOptions: DocumentVersionFactoryOptions = {}
): DocumentVersionDomain[] {
  return Array.from({ length: count }, (_, i) => 
    createDocumentVersionDomain({ ...baseOptions, index: i })
  );
}

/**
 * Create versions for a specific document
 */
export function createDocumentVersionsForDocument(
  documentId: string,
  versionCount: number
): DocumentVersionDomain[] {
  return Array.from({ length: versionCount }, (_, i) => 
    createDocumentVersionDomain({
      documentId,
      versionNumber: i + 1,
      index: i,
    })
  );
}
