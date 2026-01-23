import { Effect } from "effect";
import type { RepoError } from "../../../errors/repository.errors";
import type { DatabaseService } from "../../../effect/services/database.service";
import type { Paginated, PaginationParams } from "../../../types/pagination";
import type { AccessPolicyPersistence } from "../../../domain/access-policy/access-policy.entity.schema";

/**
 * Access Policy Repository Contract
 * 
 * Defines the interface for access policy repository operations.
 * All methods return Effect types with typed errors and database service dependency.
 */
export interface IAccessPolicyRepository {
  /**
   * Create a new access policy
   * 
   * @param data Access policy data to create
   * @returns Effect that resolves to the created access policy
   */
  create(
    data: Omit<AccessPolicyPersistence, "id" | "createdAt" | "updatedAt">
  ): Effect.Effect<AccessPolicyPersistence, RepoError, DatabaseService>;

  /**
   * Find access policy by ID
   * 
   * @param id Policy ID (UUID string)
   * @returns Effect that resolves to the policy or fails with PolicyNotFound
   */
  findById(id: string): Effect.Effect<AccessPolicyPersistence, RepoError, DatabaseService>;

  /**
   * Find all access policies with pagination
   * 
   * @param pagination Pagination parameters
   * @returns Effect that resolves to paginated policies
   */
  findAll(
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<AccessPolicyPersistence>, RepoError, DatabaseService>;

  /**
   * Find policies by subject (user, role, or workspace)
   * 
   * @param subjectType Type of subject ("user", "role", or "workspace")
   * @param subjectId Subject ID
   * @param pagination Pagination parameters
   * @returns Effect that resolves to paginated policies
   */
  findBySubject(
    subjectType: "user" | "role" | "workspace",
    subjectId: string,
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<AccessPolicyPersistence>, RepoError, DatabaseService>;

  /**
   * Find policies by resource
   * 
   * @param resourceType Type of resource ("document", "workspace", etc.)
   * @param resourceId Resource ID (optional, null for wildcard)
   * @param pagination Pagination parameters
   * @returns Effect that resolves to paginated policies
   */
  findByResource(
    resourceType: string,
    resourceId: string | null,
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<AccessPolicyPersistence>, RepoError, DatabaseService>;

  /**
   * Update access policy by ID
   * 
   * @param id Policy ID (UUID string)
   * @param data Partial policy data to update
   * @returns Effect that resolves to the updated policy or fails with PolicyNotFound
   */
  update(
    id: string,
    data: Partial<Omit<AccessPolicyPersistence, "id" | "createdAt">>
  ): Effect.Effect<AccessPolicyPersistence, RepoError, DatabaseService>;

  /**
   * Delete access policy by ID
   * 
   * @param id Policy ID (UUID string)
   * @returns Effect that resolves to void or fails with PolicyNotFound
   */
  delete(id: string): Effect.Effect<void, RepoError, DatabaseService>;
}
