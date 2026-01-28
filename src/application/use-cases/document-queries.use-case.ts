import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import type { UseCaseError } from "../errors/use-case.errors";
import type {
  GetDocumentQuery,
  ListDocumentsQuery,
  DocumentResult,
} from "../dtos/document.dtos";
import {
  GetDocumentQuerySchema,
  ListDocumentsQuerySchema,
} from "../dtos/document.dtos";
import type { IDocumentRepository } from "../ports/document.repository.port";
import { persistenceToDomain } from "../../infrastructure/mappers/document.mapper";
import type { DocumentDomain } from "../../domain/document/document.entity.schema";
import { DatabaseService } from "../../effect/services/database.service";

/**
 * Get Document Use Case
 * 
 * Query use case for retrieving a single document by ID.
 * Orchestrates domain services and repositories using Effect composition.
 * 
 * Business Workflow:
 * 1. Validate query input
 * 2. Fetch document from repository
 * 3. Convert persistence to domain entity
 * 4. Map domain entity to result DTO
 * 5. Return document result
 * 
 * Transaction Boundary:
 * Read-only operation (fetch document). No transaction needed.
 * 
 * Dependency Injection:
 * Repository is injected via constructor, following hexagonal architecture.
 */
export class GetDocumentUseCase {
  constructor(private readonly documentRepo: IDocumentRepository) {}

  execute(
    query: GetDocumentQuery
  ): Effect.Effect<DocumentResult, UseCaseError, DatabaseService> {
    return pipe(
      // Step 1: Validate query
      Schema.decodeUnknown(GetDocumentQuerySchema)(query),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "query",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Fetch document
      Effect.flatMap((validatedQuery) =>
        pipe(
          this.documentRepo.findById(validatedQuery.documentId),
          Effect.mapError((repoError) => {
            if (repoError._tag === "DocumentNotFound") {
              return {
                _tag: "DocumentNotFound",
                documentId: repoError.documentId,
              } as UseCaseError;
            }
            return {
              _tag: "UseCaseUnknown",
              operation: "GetDocument",
              message: `Repository error: ${repoError._tag}`,
            } as UseCaseError;
          }),
          // Step 3: Convert persistence to domain entity
          Effect.flatMap((persistence) => persistenceToDomain(persistence)),
          // Step 4: Map domain entity to result DTO
          Effect.map((domain) => this.domainToResult(domain))
        )
      )
    );
  }

  /**
   * Map domain entity to result DTO
   */
  private domainToResult(domain: DocumentDomain): DocumentResult {
    return {
      id: domain.id,
      filename: domain.fileReference.filename,
      originalFilename: domain.fileReference.originalFilename,
      filePath: domain.fileReference.filePath,
      fileSize: domain.fileSize,
      checksum: domain.checksum,
      metadataTags: domain.metadataTags,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}

/**
 * List Documents Use Case
 * 
 * Query use case for listing documents with filtering and pagination.
 * Orchestrates domain services and repositories using Effect composition.
 * 
 * Business Workflow:
 * 1. Validate query input
 * 2. Determine fetch strategy (by tags or all documents)
 * 3. Fetch documents from repository with pagination
 * 4. Convert all persistence entities to domain entities
 * 5. Map domain entities to result DTOs
 * 6. Return paginated document results
 * 
 * Transaction Boundary:
 * Read-only operation (fetch documents). No transaction needed.
 * 
 * Dependency Injection:
 * Repository is injected via constructor, following hexagonal architecture.
 */
export class ListDocumentsUseCase {
  constructor(private readonly documentRepo: IDocumentRepository) {}

  execute(
    query: ListDocumentsQuery
  ): Effect.Effect<
    { documents: DocumentResult[]; total: number; page: number; limit: number },
    UseCaseError,
    DatabaseService
  > {
    return pipe(
      // Step 1: Validate query
      Schema.decodeUnknown(ListDocumentsQuerySchema)(query),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "query",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Determine fetch strategy and fetch documents
      Effect.flatMap((validatedQuery) => {
        const pagination = {
          page: validatedQuery.page || 1,
          limit: validatedQuery.limit || 20,
        };

        // If tags are provided, use findByTags, otherwise use findAll
        const fetchEffect = validatedQuery.tags && validatedQuery.tags.length > 0
          ? this.documentRepo.findByTags([...validatedQuery.tags], pagination)
          : this.documentRepo.findAll(pagination);

        return pipe(
          fetchEffect,
          Effect.mapError((repoError) => ({
            _tag: "UseCaseUnknown",
            operation: "ListDocuments",
            message: `Repository error: ${repoError._tag}`,
          } as UseCaseError)),
          // Step 3: Convert all documents to domain, then to result DTOs
          Effect.flatMap((paginated) =>
            pipe(
              // Convert all persistence entities to domain entities in parallel
              Effect.all(
                paginated.data.map((persistence) => persistenceToDomain(persistence))
              ),
              // Step 4: Map domain entities to result DTOs
              Effect.map((domains) => ({
                documents: domains.map((domain) => this.domainToResult(domain)),
                total: paginated.meta.total,
                page: paginated.meta.page,
                limit: paginated.meta.limit,
              }))
            )
          )
        );
      })
    );
  }

  /**
   * Map domain entity to result DTO
   */
  private domainToResult(domain: DocumentDomain): DocumentResult {
    return {
      id: domain.id,
      filename: domain.fileReference.filename,
      originalFilename: domain.fileReference.originalFilename,
      filePath: domain.fileReference.filePath,
      fileSize: domain.fileSize,
      checksum: domain.checksum,
      metadataTags: domain.metadataTags,
      createdAt: domain.createdAt.toISOString(),
      updatedAt: domain.updatedAt.toISOString(),
    };
  }
}
