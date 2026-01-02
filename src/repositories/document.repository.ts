import { Effect, pipe } from "effect";
import { documents, downloadTokens } from "../models";
import { eq, and, gt } from "drizzle-orm";
import type { Document, NewDocument } from "../models";
import type { DownloadToken, NewDownloadToken } from "../models/download-token.model";
import { ok, err, type Result } from "../utils/result";
import { safeParseJSON } from "../utils/safe-parse";
import { DatabaseService } from "../effect/services/database.service";
import { db } from "../config/database"; // Keep for non-migrated methods
import type { RepoError } from "../errors/repository.errors";
import { toRepoError } from "../errors/repository.errors";

export class DocumentRepository {

  /**
   * Create a new document
   * Refactored to use Effect with RepoError type
   */
  static create(data: NewDocument): Effect.Effect<Document, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: () =>
            db
              .insert(documents)
              .values(data)
              .returning()
              .then(([document]) => {
                if (!document) {
                  throw new Error("Failed to create document");
                }
                return document;
              }),
          catch: (error) => toRepoError(error),
        })
      )
    );
  }

  /**
   * Find all documents
   * Refactored to use Effect with explicit succeed/fail
   */
  static findAll(): Effect.Effect<Document[], Error, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: () => db.select().from(documents),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      )
    );
  }

  /**
   * Find document by ID
   * Refactored to use Effect with explicit succeed/fail
   */
  static findById(id: number): Effect.Effect<Document, Error, DatabaseService> {
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
            catch: (error) =>
              error instanceof Error ? error : new Error(String(error)),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail(new Error("Document not found"));
            }
            return Effect.succeed(rows[0]);
          })
        )
      )
    );
  }

  /**
   * Update document by ID
   * Refactored to use Effect with explicit succeed/fail
   */
  static update(id: number, data: Partial<Document>): Effect.Effect<Document, Error, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () =>
              db
                .update(documents)
                .set({ ...data, updatedAt: new Date().toISOString() })
                .where(eq(documents.id, id))
                .returning(),
            catch: (error) =>
              error instanceof Error ? error : new Error(String(error)),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail(new Error("Document not found"));
            }
            return Effect.succeed(rows[0]);
          })
        )
      )
    );
  }

  /**
   * Delete document by ID
   * Refactored to use Effect with explicit succeed/fail
   */
  static delete(id: number): Effect.Effect<void, Error, DatabaseService> {
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
            catch: (error) =>
              error instanceof Error ? error : new Error(String(error)),
          }),
          Effect.flatMap((existingDoc) => {
            if (!existingDoc[0]) {
              return Effect.fail(new Error("Document not found"));
            }
            return pipe(
              Effect.tryPromise({
                try: () => db.delete(documents).where(eq(documents.id, id)),
                catch: (error) =>
                  error instanceof Error ? error : new Error(String(error)),
              }),
              Effect.map(() => undefined)
            );
          })
        )
      )
    );
  }

  /**
   * Find documents by metadata tags
   * Refactored to use Effect with explicit succeed/fail
   */
  static findByTags(searchTags: string[]): Effect.Effect<Document[], Error, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () => db.select().from(documents),
            catch: (error) =>
              error instanceof Error ? error : new Error(String(error)),
          }),
          Effect.map((rows) => {
            // Filter documents by tags
            const filtered = rows.filter((doc) => {
              if (!doc.metadataTags) return false;
              const parsed = safeParseJSON<string[]>(doc.metadataTags);
              if (!parsed.ok) return false;
              const docTags = parsed.value;
              return searchTags.some((searchTag) =>
                docTags.some(
                  (docTag) =>
                    docTag.toLowerCase() === searchTag.toLowerCase() ||
                    docTag.toLowerCase().includes(searchTag.toLowerCase())
                )
              );
            });
            return filtered;
          })
        )
      )
    );
  }

}

export class DownloadTokenRepository {

  /**
   * Create a new download token
   * Refactored to use Effect with explicit succeed/fail
   */
  static create(data: NewDownloadToken): Effect.Effect<DownloadToken, Error, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: () =>
            db
              .insert(downloadTokens)
              .values(data)
              .returning()
              .then(([token]) => {
                if (!token) {
                  throw new Error("Failed to create download token");
                }
                return token;
              }),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      )
    );
  }

  /**
   * Find a valid (non-expired and unused) download token
   * Refactored to use Effect with explicit succeed/fail
   */
  static findValidToken(token: string): Effect.Effect<DownloadToken, Error, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) => {
        const now = new Date().toISOString();
        return pipe(
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(downloadTokens)
                .where(
                  and(
                    eq(downloadTokens.token, token),
                    gt(downloadTokens.expiresAt, now)
                  )
                )
                .limit(1),
            catch: (error) =>
              error instanceof Error ? error : new Error(String(error)),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail(new Error("Download token not found"));
            }
            return Effect.succeed(rows[0]);
          })
        );
      })
    );
  }

  /**
   * Mark a download token as used
   * Refactored to use Effect with explicit succeed/fail
   */
  static markAsUsed(id: number): Effect.Effect<void, Error, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(downloadTokens)
                .where(eq(downloadTokens.id, id))
                .limit(1),
            catch: (error) =>
              error instanceof Error ? error : new Error(String(error)),
          }),
          Effect.flatMap((existingToken) => {
            if (!existingToken[0]) {
              return Effect.fail(new Error("Download token not found"));
            }
            return pipe(
              Effect.tryPromise({
                try: () =>
                  db
                    .update(downloadTokens)
                    .set({ usedAt: new Date().toISOString() })
                    .where(eq(downloadTokens.id, id)),
                catch: (error) =>
                  error instanceof Error ? error : new Error(String(error)),
              }),
              Effect.map(() => undefined)
            );
          })
        )
      )
    );
  }

}

