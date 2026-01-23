import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import type { DocumentDomainError } from "./document.errors";
import {
  DocumentIdVO,
  DocumentIdSchema,
  FileReferenceVO,
  FileReferenceSchema,
  MetadataTagsVO,
  MetadataTagsSchema,
  DateTimeVO,
  DateTimeSchema,
  FileChecksumVO,
  FileChecksumSchema,
} from "./value-objects";

/**
 * Document Domain Guards
 * 
 * Validation functions that enforce domain invariants.
 * These guards use Effect Schema for validation and return Effect types.
 * They maintain domain purity by validating at the domain boundary.
 */

/**
 * Guard: Validates a string is a valid DocumentId (UUID v4)
 */
export const isDocumentId = (value: unknown): value is string => {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

/**
 * Guard: Validates and creates DocumentIdVO from string
 * Returns Effect to handle validation errors
 */
export const validateDocumentId = (
  value: unknown
): Effect.Effect<DocumentIdVO, DocumentDomainError> => {
  if (!isDocumentId(value)) {
    return Effect.fail({
      _tag: "InvalidDocumentId",
      message: `Invalid document ID format: ${value}`,
    });
  }
  return pipe(
    DocumentIdVO.fromString(value),
    Effect.mapError((parseError) => ({
      _tag: "InvalidDocumentId" as const,
      message: "Failed to parse document ID",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates file size is positive
 */
export const isValidFileSize = (fileSize: number): boolean => {
  return fileSize > 0 && Number.isFinite(fileSize);
};

/**
 * Guard: Validates and creates FileReferenceVO from components
 */
export const validateFileReference = (
  filename: string,
  originalFilename: string,
  filePath: string
): Effect.Effect<FileReferenceVO, DocumentDomainError> => {
  return pipe(
    FileReferenceVO.create(filename, originalFilename, filePath),
    Effect.mapError((parseError) => ({
      _tag: "InvalidFileReference" as const,
      message: "Failed to create file reference",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates and creates MetadataTagsVO from array
 */
export const validateMetadataTags = (
  tags: string[]
): Effect.Effect<MetadataTagsVO, DocumentDomainError> => {
  return pipe(
    MetadataTagsVO.fromArray(tags),
    Effect.mapError((parseError) => ({
      _tag: "InvalidMetadataTags" as const,
      message: "Failed to validate metadata tags",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates and creates DateTimeVO from ISO string
 */
export const validateDateTime = (
  isoString: string
): Effect.Effect<DateTimeVO, DocumentDomainError> => {
  return pipe(
    DateTimeVO.fromISOString(isoString),
    Effect.mapError((parseError) => ({
      _tag: "InvalidDateTime" as const,
      message: "Failed to parse DateTime",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates and creates FileChecksumVO from string
 */
export const validateFileChecksum = (
  checksum: string
): Effect.Effect<FileChecksumVO, DocumentDomainError> => {
  return pipe(
    FileChecksumVO.fromString(checksum),
    Effect.mapError((parseError) => ({
      _tag: "InvalidFileChecksum" as const,
      message: "Failed to validate file checksum",
      cause: parseError,
    }))
  );
};

/**
 * Guard: Validates version number is a positive integer >= 1
 */
export const isValidVersionNumber = (versionNumber: number): boolean => {
  return versionNumber >= 1 && Number.isInteger(versionNumber);
};

/**
 * Guard: Validates a string is a valid UUID v4
 */
export const isUUID = (value: unknown): value is string => {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};
