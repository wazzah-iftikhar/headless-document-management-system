import { Effect, pipe } from "effect";
import { eq } from "drizzle-orm";
import type { IDownloadTokenRepository, DownloadToken, NewDownloadToken } from "../../../application/ports/download-token.repository.port";
import { DatabaseService } from "../../../effect/services/database.service";
import type { RepoError } from "../../../errors/repository.errors";
import { toRepoError } from "../../../errors/repository.errors";
import { downloadTokens } from "../../../models/download-token.model";

/**
 * Download Token Repository Implementation (Adapter)
 * 
 * Implements the IDownloadTokenRepository port.
 * This is an ADAPTER in hexagonal architecture - the infrastructure layer
 * provides concrete implementations of application ports.
 */
export class DownloadTokenRepositoryImpl implements IDownloadTokenRepository {
  create(data: NewDownloadToken): Effect.Effect<DownloadToken, RepoError, DatabaseService> {
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

  findValidToken(token: string): Effect.Effect<DownloadToken, RepoError, DatabaseService> {
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

  markAsUsed(id: number): Effect.Effect<void, RepoError, DatabaseService> {
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
