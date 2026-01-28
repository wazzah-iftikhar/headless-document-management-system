import { Effect } from "effect";
import type { RepoError } from "../../errors/repository.errors";
import type { DatabaseService } from "../../effect/services/database.service";

/**
 * Download Token Type
 */
export type DownloadToken = {
  id: number;
  token: string;
  documentId: string;
  expiresAt: string;
  createdAt: string;
  usedAt?: string | null;
};

export type NewDownloadToken = Omit<DownloadToken, "id" | "createdAt">;

/**
 * Download Token Repository Port (Outbound Port)
 * 
 * Defines the interface for download token repository operations.
 * This is a PORT in hexagonal architecture - the application layer defines
 * what it needs from the infrastructure layer.
 */
export interface IDownloadTokenRepository {
  /**
   * Create a new download token
   */
  create(data: NewDownloadToken): Effect.Effect<DownloadToken, RepoError, DatabaseService>;

  /**
   * Find a valid (non-expired and unused) download token
   */
  findValidToken(token: string): Effect.Effect<DownloadToken, RepoError, DatabaseService>;

  /**
   * Mark a download token as used
   */
  markAsUsed(id: number): Effect.Effect<void, RepoError, DatabaseService>;
}
