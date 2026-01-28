import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import type { UseCaseError } from "../errors/use-case.errors";
import type {
  ManageAccessPolicyCommand,
  CheckPermissionQuery,
  PermissionCheckResult,
} from "../dtos/document.dtos";
import {
  ManageAccessPolicyCommandSchema,
  CheckPermissionQuerySchema,
} from "../dtos/document.dtos";
import type { IDocumentRepository } from "../ports/document.repository.port";
import type { IUserRepository } from "../ports/user.repository.port";
import type { IAccessPolicyRepository } from "../ports/access-policy.repository.port";
import { persistenceToDomain as documentPersistenceToDomain } from "../../infrastructure/mappers/document.mapper";
import { persistenceToDomain as userPersistenceToDomain } from "../../infrastructure/mappers/user.mapper";
import { persistenceToDomain as policyPersistenceToDomain } from "../../infrastructure/mappers/access-policy.mapper";
import { DocumentAccessService } from "../../domain/document-access/document-access.service";
import { PermissionAction } from "../../domain/access-policy/value-objects/permission-action.vo";
import { DatabaseService } from "../../effect/services/database.service";
import { randomUUID } from "crypto";

/**
 * Manage Access Policy Use Case
 * 
 * Creates or updates an access policy for a document.
 * 
 * Business Workflow:
 * 1. Validate command input
 * 2. Verify document exists
 * 3. Create or update access policy
 * 4. Return policy ID
 * 
 * Note: For simplicity, this always creates a new policy.
 * In a real system, you'd check if a policy exists and update it.
 * 
 * Transaction Boundary:
 * Two repository operations (verify document + create policy).
 * In production, these should be in a transaction. Simplified for training.
 * 
 * Dependency Injection:
 * Repositories are injected via constructor, following hexagonal architecture.
 */
export class ManageAccessPolicyUseCase {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly policyRepo: IAccessPolicyRepository
  ) {}

  execute(
    command: ManageAccessPolicyCommand
  ): Effect.Effect<{ policyId: string; documentId: string }, UseCaseError, DatabaseService> {
    return pipe(
      // Step 1: Validate command
      Schema.decodeUnknown(ManageAccessPolicyCommandSchema)(command),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "command",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Verify document exists
      Effect.flatMap((validatedCommand) =>
        pipe(
          this.documentRepo.findById(validatedCommand.documentId),
          Effect.mapError((repoError) => {
            if (repoError._tag === "DocumentNotFound") {
              return {
                _tag: "DocumentNotFound",
                documentId: repoError.documentId,
              } as UseCaseError;
            }
            return {
              _tag: "UseCaseUnknown",
              operation: "ManageAccessPolicy",
              message: `Repository error: ${repoError._tag}`,
            } as UseCaseError;
          }),
          // Step 3: Create access policy
          Effect.flatMap(() =>
            pipe(
              this.policyRepo.create({
                subjectType: validatedCommand.subjectType,
                subjectId: validatedCommand.subjectId,
                resourceType: "document",
                resourceId: validatedCommand.documentId,
                actions: JSON.stringify(validatedCommand.actions),
                isActive: validatedCommand.isActive, // Boolean, repository will convert to "1"/"0"
              }),
              Effect.mapError((repoError) => ({
                _tag: "UseCaseUnknown",
                operation: "ManageAccessPolicy",
                message: `Failed to create policy: ${repoError._tag}`,
              } as UseCaseError)),
              // Step 4: Return policy ID
              Effect.map((policy) => ({
                policyId: policy.id,
                documentId: validatedCommand.documentId,
              }))
            )
          )
        )
      )
    );
  }
}

/**
 * Check Permission Use Case
 * 
 * Checks if a user has a specific permission on a document.
 * Uses the DocumentAccessService domain service to evaluate permissions.
 * 
 * Business Workflow:
 * 1. Validate query input
 * 2. Fetch user, document, and policies
 * 3. Convert to domain entities
 * 4. Evaluate permission using DocumentAccessService
 * 5. Return permission check result
 * 
 * Permission Evaluation:
 * - Uses DocumentAccessService which implements precedence order:
 *   1. Admin users (all permissions)
 *   2. Explicit user policies
 *   3. Role policies
 *   4. Workspace policies
 *   5. Default deny
 * 
 * Transaction Boundary:
 * Read-only operations (fetch user, document, policies).
 * No write operations, so no transaction needed.
 * 
 * Dependency Injection:
 * Repositories are injected via constructor, following hexagonal architecture.
 */
export class CheckPermissionUseCase {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly userRepo: IUserRepository,
    private readonly policyRepo: IAccessPolicyRepository
  ) {}

  execute(
    query: CheckPermissionQuery
  ): Effect.Effect<PermissionCheckResult, UseCaseError, DatabaseService> {
    return pipe(
      // Step 1: Validate query
      Schema.decodeUnknown(CheckPermissionQuerySchema)(query),
      Effect.mapError((error) => ({
        _tag: "ValidationError",
        field: "query",
        message: String(error),
      } as UseCaseError)),
      // Step 2: Fetch user, document, and policies
      Effect.flatMap((validatedQuery) =>
        pipe(
          Effect.all({
            user: this.userRepo.findById(validatedQuery.userId),
            document: this.documentRepo.findById(validatedQuery.documentId),
            policies: this.policyRepo.findByResource("document", validatedQuery.documentId, {
              page: 1,
              limit: 1000, // Get all policies for this document
            }),
          }),
          Effect.mapError((repoError) => {
            if (repoError._tag === "UserNotFound") {
              return {
                _tag: "UserNotFound",
                userId: validatedQuery.userId,
              } as UseCaseError;
            }
            if (repoError._tag === "DocumentNotFound") {
              return {
                _tag: "DocumentNotFound",
                documentId: validatedQuery.documentId,
              } as UseCaseError;
            }
            return {
              _tag: "UseCaseUnknown",
              operation: "CheckPermission",
              message: `Repository error: ${repoError._tag}`,
            } as UseCaseError;
          }),
          // Step 3: Convert to domain entities
          Effect.flatMap(({ user, document, policies }) =>
            pipe(
              Effect.all({
                userDomain: userPersistenceToDomain(user),
                documentDomain: documentPersistenceToDomain(document),
                policyDomains: Effect.all(
                  policies.data.map((p) => policyPersistenceToDomain(p))
                ),
              }),
              // Step 4: Evaluate permission using domain service
              Effect.flatMap(({ userDomain, documentDomain, policyDomains }) =>
                pipe(
                  DocumentAccessService.evaluatePermission(
                    userDomain,
                    policyDomains,
                    documentDomain,
                    validatedQuery.action as PermissionAction
                  ),
                  Effect.mapError((domainError) => {
                    // Map domain errors to use case errors
                    if (domainError._tag === "UserNotActive") {
                      return {
                        _tag: "PermissionDenied",
                        userId: validatedQuery.userId,
                        documentId: validatedQuery.documentId,
                        action: validatedQuery.action,
                      } as UseCaseError;
                    }
                    return {
                      _tag: "UseCaseUnknown",
                      operation: "CheckPermission",
                      message: `Domain error: ${domainError._tag}`,
                    } as UseCaseError;
                  }),
                  // Step 5: Return permission check result
                  Effect.map((hasPermission) => ({
                    allowed: hasPermission,
                    reason: hasPermission
                      ? undefined
                      : "User does not have the required permission",
                  }))
                )
              )
            )
          )
        )
      )
    );
  }
}
