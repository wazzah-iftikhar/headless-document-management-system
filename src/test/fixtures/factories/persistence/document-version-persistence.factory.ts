/**
 * DocumentVersion Persistence Factory
 * 
 * Creates test instances of document version persistence models for database operations.
 */

import type { DocumentVersionPersistence } from "../../../domain/document/document-version.entity.schema";
import { generateTestUuid, generateTestDate } from "../../utils";

export interface DocumentVersionPersistenceFactoryOptions {
  id?: string;
  documentId?: string;
  versionNumber?: number;
  createdAt?: string;
  index?: number;
}

/**
 * Create a DocumentVersionPersistence model with test data
 */
export function createDocumentVersionPersistence(
  options: DocumentVersionPersistenceFactoryOptions = {}
): DocumentVersionPersistence {
  const index = options.index ?? 0;
  const id = options.id ?? generateTestUuid(index + 5000);
  const now = generateTestDate(index).toISOString();
  
  return {
    id,
    documentId: options.documentId ?? generateTestUuid(index),
    versionNumber: options.versionNumber ?? index + 1,
    createdAt: options.createdAt ?? now,
  };
}

/**
 * Create multiple DocumentVersionPersistence models
 */
export function createDocumentVersionPersistenceList(
  count: number,
  baseOptions: DocumentVersionPersistenceFactoryOptions = {}
): DocumentVersionPersistence[] {
  return Array.from({ length: count }, (_, i) => 
    createDocumentVersionPersistence({ ...baseOptions, index: i })
  );
}

/**
 * Create versions for a specific document
 */
export function createDocumentVersionPersistenceForDocument(
  documentId: string,
  versionCount: number
): DocumentVersionPersistence[] {
  return Array.from({ length: versionCount }, (_, i) => 
    createDocumentVersionPersistence({
      documentId,
      versionNumber: i + 1,
      index: i,
    })
  );
}
