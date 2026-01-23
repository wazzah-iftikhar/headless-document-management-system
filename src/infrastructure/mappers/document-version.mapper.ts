import { Effect, pipe } from "effect";
import type { DocumentVersionDomain, DocumentVersionPersistence } from "../../domain/document/document-version.entity.schema";
import { Schema } from "@effect/schema";
import { DocumentIdVO } from "../../domain/document/value-objects/document-id.vo";
import { DateTimeVO } from "../../domain/document/value-objects/date-time.vo";

/**
 * DocumentVersion Mapper
 * 
 * Maps between domain entities (DocumentVersionDomain) and persistence types (DocumentVersionPersistence).
 * Handles encoding/decoding of value objects to/from their persistence representations.
 */

/**
 * Map persistence type to domain entity
 */
export function persistenceToDomain(
  persistence: DocumentVersionPersistence
): Effect.Effect<DocumentVersionDomain, Schema.ParseError> {
  return pipe(
    Effect.all({
      documentId: DocumentIdVO.fromString(persistence.documentId),
      createdAt: DateTimeVO.fromISOString(persistence.createdAt),
    }),
    Effect.map(({ documentId, createdAt }) => ({
      id: persistence.id,
      documentId,
      versionNumber: persistence.versionNumber,
      createdAt,
    }))
  );
}

/**
 * Map domain entity to persistence type
 */
export function domainToPersistence(domain: DocumentVersionDomain): DocumentVersionPersistence {
  return {
    id: domain.id,
    documentId: domain.documentId.toString(),
    versionNumber: domain.versionNumber,
    createdAt: domain.createdAt.encode(),
  };
}
