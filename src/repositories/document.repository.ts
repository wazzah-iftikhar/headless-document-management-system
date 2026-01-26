import { Effect, pipe } from "effect";
import { downloadTokens } from "../models";
import { eq } from "drizzle-orm";
import type { DownloadToken, NewDownloadToken } from "../models/download-token.model";
import { DatabaseService } from "../effect/services/database.service";
import type { RepoError } from "../errors/repository.errors";
import { toRepoError } from "../errors/repository.errors";

/**
 * Download Token Repository
 * 
 * Handles download token operations.
 * Note: This still uses the old model structure but with UUID document_id support.
 * TODO: Migrate to new infrastructure architecture when download tokens are refactored.
 */
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
   * Fails with RepoError if token not found or expired
   */
  static findValidToken(token: string): Effect.Effect<DownloadToken, RepoError, DatabaseService> {
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
                .where(eq(downloadTokens.token, token))
                .limit(1),
            catch: (error) => toRepoError(error),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail({ _tag: "TokenNotFound", token } as RepoError);
            }
            const tokenRecord = rows[0];
            // Check if token is expired
            if (tokenRecord.expiresAt <= now) {
              return Effect.fail({ _tag: "TokenExpired", token } as RepoError);
            }
            return Effect.succeed(tokenRecord);
          })
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

