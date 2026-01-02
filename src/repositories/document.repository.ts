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
   * Refactored to use Effect with RepoError type
   */
  static findAll(): Effect.Effect<Document[], RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: () => db.select().from(documents),
          catch: (error) => toRepoError(error),
        })
      )
    );
  }

  /**
   * Find document by ID
   * Returns null if not found (modeled as data, not error per article)
   */
  static findById(id: number): Effect.Effect<Document | null, RepoError, DatabaseService> {
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
          Effect.map((rows) => rows[0] || null)
        )
      )
    );
  }

  /**
   * Update document by ID
   * Returns null if not found (modeled as data, not error per article)
   */
  static update(id: number, data: Partial<Document>): Effect.Effect<Document | null, RepoError, DatabaseService> {
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
            catch: (error) => toRepoError(error),
          }),
          Effect.map((rows) => rows[0] || null)
        )
      )
    );
  }

  /**
   * Delete document by ID
   * Returns null if not found (modeled as data, not error per article)
   */
  static delete(id: number): Effect.Effect<Document | null, RepoError, DatabaseService> {
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
          Effect.flatMap((existingDoc) => {
            if (!existingDoc[0]) {
              return Effect.succeed(null);
            }
            return pipe(
              Effect.tryPromise({
                try: () => db.delete(documents).where(eq(documents.id, id)),
                catch: (error) => toRepoError(error),
              }),
              Effect.map(() => existingDoc[0])
            );
          })
        )
      )
    );
  }

  /**
   * Find documents by metadata tags
   * Refactored to use Effect with RepoError type
   */
  static findByTags(searchTags: string[]): Effect.Effect<Document[], RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () => db.select().from(documents),
            catch: (error) => toRepoError(error),
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
   * Refactored to use Effect with RepoError type
   */
  static create(data: NewDownloadToken): Effect.Effect<DownloadToken, RepoError, DatabaseService> {
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
          catch: (error) => toRepoError(error),
        })
      )
    );
  }

  /**
   * Find a valid (non-expired and unused) download token
   * Returns null if not found (modeled as data, not error per article)
   */
  static findValidToken(token: string): Effect.Effect<DownloadToken | null, RepoError, DatabaseService> {
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
            catch: (error) => toRepoError(error),
          }),
          Effect.map((rows) => rows[0] || null)
        );
      })
    );
  }

  /**
   * Mark a download token as used
   * Refactored to use Effect with RepoError type
   */
  static markAsUsed(id: number): Effect.Effect<void, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () =>
              db
                .update(downloadTokens)
                .set({ usedAt: new Date().toISOString() })
                .where(eq(downloadTokens.id, id)),
            catch: (error) => toRepoError(error),
          }),
          Effect.map(() => undefined)
        )
      )
    );
  }

}

