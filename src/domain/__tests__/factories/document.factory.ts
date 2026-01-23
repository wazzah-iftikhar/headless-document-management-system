import { Effect } from "effect";
import type { DocumentDomain } from "../../document/document.entity.schema";
import { DocumentIdVO } from "../../document/value-objects/document-id.vo";
import { FileReferenceVO } from "../../document/value-objects/file-reference.vo";
import { FileChecksumVO } from "../../document/value-objects/file-checksum.vo";
import { MetadataTagsVO } from "../../document/value-objects/metadata-tags.vo";
import { DateTimeVO } from "../../document/value-objects/date-time.vo";

/**
 * Document Test Factory
 * 
 * Provides deterministic test data generation for Document entities.
 * All factories use fixed UUIDs and predictable data for reproducible tests.
 */
export class DocumentFactory {
  // Fixed UUIDs for deterministic testing
  private static readonly FIXED_DOCUMENT_ID = "00000000-0000-4000-8000-000000000100";
  private static readonly FIXED_CHECKSUM = "a".repeat(64); // Valid SHA-256 format

  /**
   * Create a default document with all required fields
   */
  static createDefault(): Effect.Effect<DocumentDomain> {
    return Effect.all([
      DocumentIdVO.fromString(this.FIXED_DOCUMENT_ID),
      FileReferenceVO.create(
        "test-document.pdf",
        "test-document.pdf",
        "/uploads/test-document.pdf"
      ),
      MetadataTagsVO.fromArray(["test", "document"]),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, fileReference, metadataTags, createdAt]) => ({
        id: id.getValue(),
        fileReference: fileReference.encode(),
        fileSize: 1024, // 1KB
        metadataTags: metadataTags.encode(),
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a document with custom properties
   */
  static create(overrides?: Partial<DocumentDomain>): Effect.Effect<DocumentDomain> {
    return this.createDefault().pipe(
      Effect.map((document) => ({
        ...document,
        ...overrides,
        // Ensure fileReference is properly merged if provided
        fileReference: overrides?.fileReference ?? document.fileReference,
        // Ensure metadataTags is properly merged if provided
        metadataTags: overrides?.metadataTags ?? document.metadataTags,
      }))
    );
  }

  /**
   * Create a document with a checksum
   */
  static createWithChecksum(): Effect.Effect<DocumentDomain> {
    return Effect.all([
      this.createDefault(),
      FileChecksumVO.fromString(this.FIXED_CHECKSUM),
    ]).pipe(
      Effect.map(([document, checksum]) => ({
        ...document,
        checksum: checksum.getValue(),
      }))
    );
  }

  /**
   * Create a document without a checksum
   */
  static createWithoutChecksum(): Effect.Effect<DocumentDomain> {
    return this.createDefault().pipe(
      Effect.map((document) => ({
        ...document,
        checksum: undefined,
      }))
    );
  }

  /**
   * Create a document with a specific ID
   */
  static createWithId(documentId: string): Effect.Effect<DocumentDomain> {
    return Effect.all([
      DocumentIdVO.fromString(documentId),
      FileReferenceVO.create(
        "test-document.pdf",
        "test-document.pdf",
        "/uploads/test-document.pdf"
      ),
      MetadataTagsVO.fromArray(["test"]),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, fileReference, metadataTags, createdAt]) => ({
        id: id.getValue(),
        fileReference: fileReference.encode(),
        fileSize: 1024,
        metadataTags: metadataTags.encode(),
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a document with specific metadata tags
   */
  static createWithTags(tags: string[]): Effect.Effect<DocumentDomain> {
    return Effect.all([
      DocumentIdVO.fromString(this.FIXED_DOCUMENT_ID),
      FileReferenceVO.create(
        "test-document.pdf",
        "test-document.pdf",
        "/uploads/test-document.pdf"
      ),
      MetadataTagsVO.fromArray(tags),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, fileReference, metadataTags, createdAt]) => ({
        id: id.getValue(),
        fileReference: fileReference.encode(),
        fileSize: 1024,
        metadataTags: metadataTags.encode(),
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a document with a specific file size
   */
  static createWithFileSize(fileSize: number): Effect.Effect<DocumentDomain> {
    return this.create({ fileSize });
  }

  /**
   * Create a document with empty metadata tags
   */
  static createWithEmptyTags(): Effect.Effect<DocumentDomain> {
    return Effect.all([
      DocumentIdVO.fromString(this.FIXED_DOCUMENT_ID),
      FileReferenceVO.create(
        "test-document.pdf",
        "test-document.pdf",
        "/uploads/test-document.pdf"
      ),
      MetadataTagsVO.empty(),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, fileReference, metadataTags, createdAt]) => ({
        id: id.getValue(),
        fileReference: fileReference.encode(),
        fileSize: 1024,
        metadataTags: metadataTags.encode(),
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a large document (for file size testing)
   */
  static createLarge(): Effect.Effect<DocumentDomain> {
    return this.create({ fileSize: 10 * 1024 * 1024 }); // 10MB
  }

  /**
   * Create a small document (for file size testing)
   */
  static createSmall(): Effect.Effect<DocumentDomain> {
    return this.create({ fileSize: 100 }); // 100 bytes
  }
}
