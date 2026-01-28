import { Effect } from "effect";
import type { RepoError } from "../../errors/repository.errors";
import type { DatabaseService } from "../../effect/services/database.service";
import type { Paginated, PaginationParams } from "../../types/pagination";
import type { DocumentVersionPersistence } from "../../domain/document/document-version.entity.schema";

/**
 * Document Version Repository Port (Outbound Port)
 * 
 * Defines the interface for document version repository operations.
 * This is a PORT in hexagonal architecture - the application layer defines
 * what it needs from the infrastructure layer.
 */
export interface IDocumentVersionRepository {
  /**
   * Create a new document version
   * 
   * @param data Document version data to create
   * @returns Effect that resolves to the created document version
   */
  create(
    data: Omit<DocumentVersionPersistence, "id" | "createdAt">
  ): Effect.Effect<DocumentVersionPersistence, RepoError, DatabaseService>;

  /**
   * Find document version by ID
   * 
   * @param id Version ID (UUID string)
   * @returns Effect that resolves to the version or fails with VersionNotFound
   */
  findById(id: string): Effect.Effect<DocumentVersionPersistence, RepoError, DatabaseService>;

  /**
   * Find all versions for a document with pagination
   * 
   * @param documentId Document ID (UUID string)
   * @param pagination Pagination parameters
   * @returns Effect that resolves to paginated document versions
   */
  findByDocumentId(
    documentId: string,
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<DocumentVersionPersistence>, RepoError, DatabaseService>;

  /**
   * Find latest version for a document
   * 
   * @param documentId Document ID (UUID string)
   * @returns Effect that resolves to the latest version or fails with VersionNotFound
   */
  findLatestByDocumentId(
    documentId: string
  ): Effect.Effect<DocumentVersionPersistence, RepoError, DatabaseService>;

  /**
   * Delete document version by ID
   * 
   * @param id Version ID (UUID string)
   * @returns Effect that resolves to void or fails with VersionNotFound
   */
  delete(id: string): Effect.Effect<void, RepoError, DatabaseService>;
}
