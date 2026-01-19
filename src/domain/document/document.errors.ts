import type { ParseError } from "@effect/schema/ParseError";

/**
 * Document Domain Errors
 * 
 * Pure domain errors related to Document entity operations.
 * These represent business rule violations and domain invariants.
 * No infrastructure concerns - these are domain-specific.
 */
export type DocumentDomainError =
  // Value Object Creation Errors
  | { _tag: "InvalidDocumentId"; message: string; cause?: ParseError }
  | { _tag: "InvalidFileReference"; message: string; cause?: ParseError }
  | { _tag: "InvalidMetadataTags"; message: string; cause?: ParseError }
  | { _tag: "InvalidDateTime"; message: string; cause?: ParseError }
  | { _tag: "InvalidFileChecksum"; message: string; cause?: ParseError }

  // Document Entity Creation Errors
  | { _tag: "DocumentCreationFailed"; message: string; reason: string }
  | { _tag: "InvalidFileSize"; message: string; fileSize: number }
  | { _tag: "DocumentNotFound"; documentId: string }

  // Document Version Errors
  | { _tag: "InvalidVersionNumber"; message: string; versionNumber: number }
  | { _tag: "VersionNotFound"; versionId: string }

  // Domain Invariant Violations
  | { _tag: "FileSizeMismatch"; expected: number; actual: number }
  | { _tag: "ChecksumMismatch"; expected: string; actual: string };

/**
 * Helper to create InvalidDocumentId error
 */
export const invalidDocumentId = (
  message: string,
  cause?: ParseError
): DocumentDomainError => ({
  _tag: "InvalidDocumentId",
  message,
  cause,
});

/**
 * Helper to create InvalidFileReference error
 */
export const invalidFileReference = (
  message: string,
  cause?: ParseError
): DocumentDomainError => ({
  _tag: "InvalidFileReference",
  message,
  cause,
});

/**
 * Helper to create InvalidMetadataTags error
 */
export const invalidMetadataTags = (
  message: string,
  cause?: ParseError
): DocumentDomainError => ({
  _tag: "InvalidMetadataTags",
  message,
  cause,
});

/**
 * Helper to create InvalidDateTime error
 */
export const invalidDateTime = (
  message: string,
  cause?: ParseError
): DocumentDomainError => ({
  _tag: "InvalidDateTime",
  message,
  cause,
});

/**
 * Helper to create InvalidFileChecksum error
 */
export const invalidFileChecksum = (
  message: string,
  cause?: ParseError
): DocumentDomainError => ({
  _tag: "InvalidFileChecksum",
  message,
  cause,
});

/**
 * Helper to create DocumentNotFound error
 */
export const documentNotFound = (documentId: string): DocumentDomainError => ({
  _tag: "DocumentNotFound",
  documentId,
});

/**
 * Helper to create InvalidFileSize error
 */
export const invalidFileSize = (
  fileSize: number,
  message: string = "File size must be greater than 0"
): DocumentDomainError => ({
  _tag: "InvalidFileSize",
  message,
  fileSize,
});

/**
 * Helper to create InvalidVersionNumber error
 */
export const invalidVersionNumber = (
  versionNumber: number
): DocumentDomainError => ({
  _tag: "InvalidVersionNumber",
  message: "Version number must be a positive integer >= 1",
  versionNumber,
});
