import { Effect, pipe } from "effect";
import { eq, desc, asc, sql } from "drizzle-orm";
import type { RepoError } from "../../../errors/repository.errors";
import { toRepoError } from "../../../errors/repository.errors";
import { DatabaseService } from "../../../effect/services/database.service";
import type { Paginated, PaginationParams } from "../../../types/pagination";
import { DEFAULT_PAGINATION, calculatePaginationMeta } from "../../../types/pagination";
import type { DocumentVersionPersistence } from "../../../domain/document/document-version.entity.schema";
import type { IDocumentVersionRepository } from "../../../application/ports/document-version.repository.port";
import { documentVersions } from "../../database/schemas/document-versions.schema";
import type {
  DocumentVersionRow,
  NewDocumentVersionRow,
} from "../../database/schemas/document-versions.schema";

/**
 * Document Version Repository Implementation
 */
export class DocumentVersionRepositoryImpl implements IDocumentVersionRepository {
  private mapRowToDomain(row: DocumentVersionRow): DocumentVersionPersistence {
    return {
      id: row.id,
      documentId: row.documentId,
      versionNumber: row.versionNumber,
      createdAt: row.createdAt,
    };
  }

  private mapDomainToRow(
    data: Omit<DocumentVersionPersistence, "id" | "createdAt">
  ): Omit<NewDocumentVersionRow, "id" | "createdAt" | "updatedAt"> {
    return {
      documentId: data.documentId,
      versionNumber: data.versionNumber,
    };
  }

  create(
    data: Omit<DocumentVersionPersistence, "id" | "createdAt">
  ): Effect.Effect<DocumentVersionPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const row = this.mapDomainToRow(data);
            const result = await db.insert(documentVersions).values(row).returning();

            if (!result[0]) {
              throw new Error("Failed to create document version");
            }

            return this.mapRowToDomain(result[0]);
          },
          catch: (error) => toRepoError(error),
        })
      )
    );
  }

  findById(id: string): Effect.Effect<DocumentVersionPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(documentVersions)
                .where(eq(documentVersions.id, id))
                .limit(1),
            catch: (error) => toRepoError(error),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail({
                _tag: "DocumentVersionNotFound",
                versionId: id,
              } as RepoError);
            }
            return Effect.succeed(this.mapRowToDomain(rows[0]));
          })
        )
      )
    );
  }

  findByDocumentId(
    documentId: string,
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<DocumentVersionPersistence>, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const params = { ...DEFAULT_PAGINATION, ...pagination };
            const offset = (params.page - 1) * params.limit;
            // Sort by version number descending (latest first)
            const orderBy = desc(documentVersions.versionNumber);

            const whereClause = eq(documentVersions.documentId, documentId);

            const countResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(documentVersions)
              .where(whereClause);
            const total = Number(countResult[0]?.count || 0);

            const rows = await db
              .select()
              .from(documentVersions)
              .where(whereClause)
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
    );
  }

  findLatestByDocumentId(
    documentId: string
  ): Effect.Effect<DocumentVersionPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(documentVersions)
                .where(eq(documentVersions.documentId, documentId))
                .orderBy(desc(documentVersions.versionNumber))
                .limit(1),
            catch: (error) => toRepoError(error),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail({
                _tag: "DocumentVersionNotFound",
                versionId: documentId, // Using documentId as identifier
              } as RepoError);
            }
            return Effect.succeed(this.mapRowToDomain(rows[0]));
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
              const existing = await db
                .select()
                .from(documentVersions)
                .where(eq(documentVersions.id, id))
                .limit(1);

              if (!existing[0]) {
                throw new Error("Document version not found");
              }

              await db.delete(documentVersions).where(eq(documentVersions.id, id));
            },
            catch: (error) => toRepoError(error),
          }),
          Effect.mapError((error) => {
            if (error instanceof Error && error.message === "Document version not found") {
              return { _tag: "DocumentVersionNotFound", versionId: id } as RepoError;
            }
            return toRepoError(error);
          }),
          Effect.map(() => undefined)
        )
      )
    );
  }
}
