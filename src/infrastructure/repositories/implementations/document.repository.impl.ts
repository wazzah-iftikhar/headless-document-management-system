import { Effect, pipe } from "effect";
import { eq, and, desc, asc, sql, like, or } from "drizzle-orm";
import type { RepoError } from "../../../errors/repository.errors";
import { toRepoError } from "../../../errors/repository.errors";
import { DatabaseService } from "../../../effect/services/database.service";
import type { Paginated, PaginationParams } from "../../../types/pagination";
import { DEFAULT_PAGINATION, calculatePaginationMeta } from "../../../types/pagination";
import type { DocumentPersistence } from "../../../domain/document/document.entity.schema";
import type { IDocumentRepository } from "../../../application/ports/document.repository.port";
import { documents } from "../../database/schemas/documents.schema";
import type { DocumentRow, NewDocumentRow } from "../../database/schemas/documents.schema";

/**
 * Document Repository Implementation
 * 
 * Implements IDocumentRepository using Drizzle ORM with the new database schemas.
 * Handles mapping between domain types (DocumentPersistence) and database rows.
 */
export class DocumentRepositoryImpl implements IDocumentRepository {
  /**
   * Map database row to domain persistence type
   */
  private mapRowToDomain(row: DocumentRow): DocumentPersistence {
    return {
      id: row.id,
      filename: row.filename,
      originalFilename: row.originalFilename,
      filePath: row.filePath,
      fileSize: row.fileSize,
      checksum: row.checksum ?? undefined,
      metadataTags: row.metadataTags, // Already JSON string
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Map domain persistence type to database row (for inserts)
   */
  private mapDomainToRow(
    data: Omit<DocumentPersistence, "id" | "createdAt" | "updatedAt">
  ): Omit<NewDocumentRow, "id" | "createdAt" | "updatedAt"> {
    return {
      filename: data.filename,
      originalFilename: data.originalFilename,
      filePath: data.filePath,
      fileSize: data.fileSize,
      checksum: data.checksum ?? null,
      metadataTags: data.metadataTags,
    };
  }

  create(
    data: Omit<DocumentPersistence, "id" | "createdAt" | "updatedAt">
  ): Effect.Effect<DocumentPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const row = this.mapDomainToRow(data);
            const result = await db
              .insert(documents)
              .values(row)
              .returning();
            
            if (!result[0]) {
              throw new Error("Failed to create document");
            }
            
            return this.mapRowToDomain(result[0]);
          },
          catch: (error) => toRepoError(error),
        })
      )
    );
  }

  findById(id: string): Effect.Effect<DocumentPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(documents)
                .where(eq(documents.id, id))
                .limit(1),
            catch: (error) => toRepoError(error),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail({
                _tag: "DocumentNotFound",
                documentId: id,
              } as RepoError);
            }
            return Effect.succeed(this.mapRowToDomain(rows[0]));
          })
        )
      )
    );
  }

  findAll(
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<DocumentPersistence>, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: async () => {
              const params = { ...DEFAULT_PAGINATION, ...pagination };
              const offset = (params.page - 1) * params.limit;
              const orderBy =
                params.sortOrder === "asc"
                  ? asc(documents[params.sortBy as keyof typeof documents] || documents.createdAt)
                  : desc(documents[params.sortBy as keyof typeof documents] || documents.createdAt);

              // Get total count
              const countResult = await db
                .select({ count: sql<number>`count(*)` })
                .from(documents);
              const total = Number(countResult[0]?.count || 0);

              // Get paginated results
              const rows = await db
                .select()
                .from(documents)
                .orderBy(orderBy)
                .limit(params.limit)
                .offset(offset);

              return {
                data: rows.map((row) => this.mapRowToDomain(row)),
                meta: calculatePaginationMeta(total, params.page, params.limit),
              };
            },
            catch: (error) => toRepoError(error),
          })
        )
      )
    );
  }

  update(
    id: string,
    data: Partial<Omit<DocumentPersistence, "id" | "createdAt">>
  ): Effect.Effect<DocumentPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: async () => {
              const updateData: Partial<NewDocumentRow> = {
                ...(data.filename && { filename: data.filename }),
                ...(data.originalFilename && { originalFilename: data.originalFilename }),
                ...(data.filePath && { filePath: data.filePath }),
                ...(data.fileSize !== undefined && { fileSize: data.fileSize }),
                ...(data.checksum !== undefined && { checksum: data.checksum ?? null }),
                ...(data.metadataTags && { metadataTags: data.metadataTags }),
                updatedAt: new Date().toISOString(),
              };

              const result = await db
                .update(documents)
                .set(updateData)
                .where(eq(documents.id, id))
                .returning();

              if (!result[0]) {
                throw new Error("Document not found");
              }

              return this.mapRowToDomain(result[0]);
            },
            catch: (error) => toRepoError(error),
          }),
          Effect.mapError((error) => {
            if (error instanceof Error && error.message === "Document not found") {
              return { _tag: "DocumentNotFound", documentId: id } as RepoError;
            }
            return toRepoError(error);
          })
        )
      )
    );
  }

  delete(id: string): Effect.Effect<void, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: async () => {
              // Check if document exists
              const existing = await db
                .select()
                .from(documents)
                .where(eq(documents.id, id))
                .limit(1);

              if (!existing[0]) {
                throw new Error("Document not found");
              }

              // Delete document
              await db.delete(documents).where(eq(documents.id, id));
            },
            catch: (error) => toRepoError(error),
          }),
          Effect.mapError((error) => {
            if (error instanceof Error && error.message === "Document not found") {
              return { _tag: "DocumentNotFound", documentId: id } as RepoError;
            }
            return toRepoError(error);
          }),
          Effect.map(() => undefined)
        )
      )
    );
  }

  findByTags(
    tags: string[],
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<DocumentPersistence>, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: async () => {
              const params = { ...DEFAULT_PAGINATION, ...pagination };
              const offset = (params.page - 1) * params.limit;

              // Get all documents (SQLite doesn't have great JSON support, so we filter in memory)
              // In production, you might want to use a full-text search or better JSON support
              const allRows = await db.select().from(documents);
              
              // Filter by tags
              const filteredRows = allRows.filter((row) => {
                try {
                  const docTags = JSON.parse(row.metadataTags || "[]") as string[];
                  return tags.some((searchTag) =>
                    docTags.some(
                      (docTag) =>
                        docTag.toLowerCase() === searchTag.toLowerCase() ||
                        docTag.toLowerCase().includes(searchTag.toLowerCase())
                    )
                  );
                } catch {
                  return false;
                }
              });

              const total = filteredRows.length;
              const paginatedRows = filteredRows.slice(offset, offset + params.limit);

              return {
                data: paginatedRows.map((row) => this.mapRowToDomain(row)),
                meta: calculatePaginationMeta(total, params.page, params.limit),
              };
            },
            catch: (error) => toRepoError(error),
          })
        )
      )
    );
  }
}
