import { Effect } from "effect";
import type { RepoError } from "../../errors/repository.errors";
import type { DatabaseService } from "../../effect/services/database.service";
import type { Paginated, PaginationParams } from "../../types/pagination";
import type { UserPersistence } from "../../domain/user/user.entity.schema";

/**
 * User Repository Port (Outbound Port)
 * 
 * Defines the interface for user repository operations.
 * This is a PORT in hexagonal architecture - the application layer defines
 * what it needs from the infrastructure layer.
 */
export interface IUserRepository {
  /**
   * Create a new user
   * 
   * @param data User data to create
   * @returns Effect that resolves to the created user
   */
  create(
    data: Omit<UserPersistence, "id" | "createdAt" | "updatedAt">
  ): Effect.Effect<UserPersistence, RepoError, DatabaseService>;

  /**
   * Find user by ID
   * 
   * @param id User ID (UUID string)
   * @returns Effect that resolves to the user or fails with UserNotFound
   */
  findById(id: string): Effect.Effect<UserPersistence, RepoError, DatabaseService>;

  /**
   * Find user by email
   * 
   * @param email User email address
   * @returns Effect that resolves to the user or fails with UserNotFound
   */
  findByEmail(email: string): Effect.Effect<UserPersistence, RepoError, DatabaseService>;

  /**
   * Find all users with pagination
   * 
   * @param pagination Pagination parameters
   * @returns Effect that resolves to paginated users
   */
  findAll(
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<UserPersistence>, RepoError, DatabaseService>;

  /**
   * Update user by ID
   * 
   * @param id User ID (UUID string)
   * @param data Partial user data to update
   * @returns Effect that resolves to the updated user or fails with UserNotFound
   */
  update(
    id: string,
    data: Partial<Omit<UserPersistence, "id" | "createdAt">>
  ): Effect.Effect<UserPersistence, RepoError, DatabaseService>;

  /**
   * Delete user by ID
   * 
   * @param id User ID (UUID string)
   * @returns Effect that resolves to void or fails with UserNotFound
   */
  delete(id: string): Effect.Effect<void, RepoError, DatabaseService>;
}
