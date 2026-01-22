import { Effect, pipe } from "effect";
import type { DocumentDomain, DocumentPersistence } from "../../domain/document/document.entity.schema";
import { DocumentPersistenceSchema } from "../../domain/document/document.entity.schema";
import { Schema } from "@effect/schema";
import {
  DocumentIdVO,
  FileReferenceVO,
  MetadataTagsVO,
  DateTimeVO,
  FileChecksumVO,
} from "../../domain/document/value-objects";

/**
 * Document Mapper
 * 
 * Maps between domain entities (DocumentDomain) and persistence types (DocumentPersistence).
 * Handles encoding/decoding of value objects to/from their persistence representations.
 */

/**
 * Map persistence type to domain entity
 */
export function persistenceToDomain(
  persistence: DocumentPersistence
): Effect.Effect<DocumentDomain, Schema.ParseError> {
  return pipe(
    Effect.all({
      id: DocumentIdVO.fromString(persistence.id),
      fileReference: FileReferenceVO.create(
        persistence.filename,
        persistence.originalFilename,
        persistence.filePath
      ),
      metadataTags: MetadataTagsVO.fromArray(
        JSON.parse(persistence.metadataTags || "[]")
      ),
      createdAt: DateTimeVO.fromISOString(persistence.createdAt),
      updatedAt: DateTimeVO.fromISOString(persistence.updatedAt),
      checksum: persistence.checksum
        ? pipe(
            FileChecksumVO.fromString(persistence.checksum),
            Effect.map((cs) => cs as DocumentDomain["checksum"])
          )
        : Effect.succeed(undefined),
    }),
    Effect.map(({ id, fileReference, metadataTags, createdAt, updatedAt, checksum }) => ({
      id,
      fileReference,
      fileSize: persistence.fileSize,
      checksum,
      metadataTags,
      createdAt,
      updatedAt,
    }))
  );
}

/**
 * Map domain entity to persistence type
 */
export function domainToPersistence(domain: DocumentDomain): DocumentPersistence {
  const fileRef = domain.fileReference.encode();
  const tags = domain.metadataTags.encode();

  return {
    id: domain.id.toString(),
    filename: fileRef.filename,
    originalFilename: fileRef.originalFilename,
    filePath: fileRef.filePath,
    fileSize: domain.fileSize,
    checksum: domain.checksum?.encode() ?? undefined,
    metadataTags: JSON.stringify(tags),
    createdAt: domain.createdAt.encode(),
    updatedAt: domain.updatedAt.encode(),
  };
}

/**
 * Map persistence type to domain entity (Effect-based, handles errors)
 */
export function persistenceToDomainEffect(
  persistence: DocumentPersistence
): Effect.Effect<DocumentDomain, Schema.ParseError> {
  return persistenceToDomain(persistence);
}
