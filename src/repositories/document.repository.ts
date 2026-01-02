import { Effect } from "effect";
import { documents, downloadTokens } from "../models";
import { eq, and, gt } from "drizzle-orm";
import type { Document, NewDocument } from "../models";
import type { DownloadToken, NewDownloadToken } from "../models/download-token.model";
import { ok, err, type Result } from "../utils/result";
import { safeParseJSON } from "../utils/safe-parse";
import { DatabaseService } from "../effect/services/database.service";
import { db } from "../config/database"; // Keep for non-migrated methods

export class DocumentRepository {

  /**
   * Create a new document
   * Refactored to use Effect for error handling and dependency injection
   */
  static create(data: NewDocument): Effect.Effect<Document, Error, DatabaseService> {
    
    return Effect.gen(function* (_) {
      
      const db = yield* _(DatabaseService);

      const result = yield* _(
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
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      );

      return result;

    });
  }

  /**
   * Find all documents
   * Refactored to use Effect for error handling and dependency injection
   */
  static findAll(): Effect.Effect<Document[], Error, DatabaseService> {
    return Effect.gen(function* (_) {
      const db = yield* _(DatabaseService);

      const rows = yield* _(
        Effect.tryPromise({
          try: () => db.select().from(documents),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      );

      return rows;
    });
  }

  /**
   * Find document by ID
   * Refactored to use Effect for error handling and dependency injection
   */
  static findById(id: number): Effect.Effect<Document, Error, DatabaseService> {
    return Effect.gen(function* (_) {
      const db = yield* _(DatabaseService);

      const rows = yield* _(
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(documents)
              .where(eq(documents.id, id))
              .limit(1),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      );

      if (!rows[0]) {
        return yield* _(Effect.fail(new Error("Document not found")));
      }

      return rows[0];
    });
  }

  /**
   * Update document by ID
   * Refactored to use Effect for error handling and dependency injection
   */
  static update(id: number, data: Partial<Document>): Effect.Effect<Document, Error, DatabaseService> {
    return Effect.gen(function* (_) {
      const db = yield* _(DatabaseService);

      const rows = yield* _(
        Effect.tryPromise({
          try: () =>
            db
              .update(documents)
              .set({ ...data, updatedAt: new Date().toISOString() })
              .where(eq(documents.id, id))
              .returning(),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      );

      if (!rows[0]) {
        return yield* _(Effect.fail(new Error("Document not found")));
      }

      return rows[0];
    });
  }

  /**
   * Delete document by ID
   * Refactored to use Effect for error handling and dependency injection
   */
  static delete(id: number): Effect.Effect<void, Error, DatabaseService> {
    return Effect.gen(function* (_) {
      const db = yield* _(DatabaseService);

      // First check if document exists
      const existingDoc = yield* _(
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(documents)
              .where(eq(documents.id, id))
              .limit(1),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      );

      if (!existingDoc[0]) {
        return yield* _(Effect.fail(new Error("Document not found")));
      }

      // Delete the document
      yield* _(
        Effect.tryPromise({
          try: () => db.delete(documents).where(eq(documents.id, id)),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      );

      return undefined;
    });
  }

  /**
   * Find documents by metadata tags
   * Refactored to use Effect for error handling and dependency injection
   */
  static findByTags(searchTags: string[]): Effect.Effect<Document[], Error, DatabaseService> {
    return Effect.gen(function* (_) {
      const db = yield* _(DatabaseService);

      const rows = yield* _(
        Effect.tryPromise({
          try: () => db.select().from(documents),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      );

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
    });
  }

}

export class DownloadTokenRepository {

  /**
   * Create a new download token
   * Refactored to use Effect for error handling and dependency injection
   */
  static create(data: NewDownloadToken): Effect.Effect<DownloadToken, Error, DatabaseService> {
    return Effect.gen(function* (_) {
      const db = yield* _(DatabaseService);

      const result = yield* _(
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
      );

      return result;
    });
  }

  /**
   * Find a valid (non-expired and unused) download token
   * Refactored to use Effect for error handling and dependency injection
   */
  static findValidToken(token: string): Effect.Effect<DownloadToken, Error, DatabaseService> {
    return Effect.gen(function* (_) {
      const db = yield* _(DatabaseService);

      const now = new Date().toISOString();

      const rows = yield* _(
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
        })
      );

      if (!rows[0]) {
        return yield* _(Effect.fail(new Error("Download token not found")));
      }

      return rows[0];
    });
  }

  /**
   * Mark a download token as used
   * Refactored to use Effect for error handling and dependency injection
   */
  static markAsUsed(id: number): Effect.Effect<void, Error, DatabaseService> {
    return Effect.gen(function* (_) {
      const db = yield* _(DatabaseService);

      // First check if token exists
      const existingToken = yield* _(
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(downloadTokens)
              .where(eq(downloadTokens.id, id))
              .limit(1),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      );

      if (!existingToken[0]) {
        return yield* _(Effect.fail(new Error("Download token not found")));
      }

      // Mark token as used
      yield* _(
        Effect.tryPromise({
          try: () =>
            db
              .update(downloadTokens)
              .set({ usedAt: new Date().toISOString() })
              .where(eq(downloadTokens.id, id)),
          catch: (error) =>
            error instanceof Error ? error : new Error(String(error)),
        })
      );

      return undefined;
    });
  }

}

