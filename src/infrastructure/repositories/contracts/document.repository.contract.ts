import { Effect } from "effect";
import type { RepoError } from "../../../errors/repository.errors";
import type { DatabaseService } from "../../../effect/services/database.service";
import type { Paginated, PaginationParams } from "../../../types/pagination";
import type { DocumentPersistence } from "../../../domain/document/document.entity.schema";
import type { DocumentIdVO } from "../../../domain/document/value-objects/document-id.vo";

/**
 * Document Repository Contract
 * 
 * Defines the interface for document repository operations.
 * All methods return Effect types with typed errors and database service dependency.
 * 
 * This is a contract/interface - implementations should be in the infrastructure layer.
 */
export interface IDocumentRepository {
  /**
   * Create a new document
   * 
   * @param data Document data to create
   * @returns Effect that resolves to the created document
   */
  create(
    data: Omit<DocumentPersistence, "id" | "createdAt" | "updatedAt">
  ): Effect.Effect<DocumentPersistence, RepoError, DatabaseService>;

  /**
   * Find document by ID
   * 
   * @param id Document ID (UUID string)
   * @returns Effect that resolves to the document or fails with DocumentNotFound
   */
  findById(id: string): Effect.Effect<DocumentPersistence, RepoError, DatabaseService>;

  /**
   * Find all documents with pagination
   * 
   * @param pagination Pagination parameters
   * @returns Effect that resolves to paginated documents
   */
  findAll(
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<DocumentPersistence>, RepoError, DatabaseService>;

  /**
   * Update document by ID
   * 
   * @param id Document ID (UUID string)
   * @param data Partial document data to update
   * @returns Effect that resolves to the updated document or fails with DocumentNotFound
   */
  update(
    id: string,
    data: Partial<Omit<DocumentPersistence, "id" | "createdAt">>
  ): Effect.Effect<DocumentPersistence, RepoError, DatabaseService>;

  /**
   * Delete document by ID
   * 
   * @param id Document ID (UUID string)
   * @returns Effect that resolves to void or fails with DocumentNotFound
   */
  delete(id: string): Effect.Effect<void, RepoError, DatabaseService>;

  /**
   * Find documents by metadata tags
   * 
   * @param tags Array of tags to search for
   * @param pagination Pagination parameters
   * @returns Effect that resolves to paginated documents matching the tags
   */
  findByTags(
    tags: string[],
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<DocumentPersistence>, RepoError, DatabaseService>;
}
