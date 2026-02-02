import { Effect, pipe } from "effect";
import type { UseCaseError } from "../errors/use-case.errors";
import type { IDocumentRepository } from "../ports/document.repository.port";
import type { IUserRepository } from "../ports/user.repository.port";
import type { IAccessPolicyRepository } from "../ports/access-policy.repository.port";
import { persistenceToDomain as documentPersistenceToDomain } from "../../infrastructure/mappers/document.mapper";
import { persistenceToDomain as userPersistenceToDomain } from "../../infrastructure/mappers/user.mapper";
import { persistenceToDomain as policyPersistenceToDomain } from "../../infrastructure/mappers/access-policy.mapper";
import { DocumentAccessService } from "../../domain/document-access/document-access.service";
import { PermissionAction } from "../../domain/access-policy/value-objects/permission-action.vo";
import { DatabaseService } from "../../effect/services/database.service";
import { AuditService, type AuditUserContext } from "./audit.service";
import { logger } from "../../infrastructure/services/logger.service";

/**
 * User Context
 * Minimal user context required for RBAC checks
 */
export interface UserContext {
  userId: string;
  workspaceId: string;
}

/**
 * RBAC Service
 * 
 * Service for enforcing Role-Based Access Control in use cases.
 * 
 * This service:
 * - Fetches user, document, and policies
 * - Uses DocumentAccessService to evaluate permissions
 * - Returns PermissionDenied error if access is denied
 * - Keeps access control logic centralized and reusable
 */
export class RBACService {
  constructor(
    private readonly documentRepo: IDocumentRepository,
    private readonly userRepo: IUserRepository,
    private readonly policyRepo: IAccessPolicyRepository,
    private readonly auditService?: AuditService // Optional - audit service may not always be available
  ) {}

  /**
   * Check if user has permission to perform an action on a document
   * 
   * @param userContext - User context from JWT (userId, workspaceId)
   * @param documentId - Document ID to check access for
   * @param requiredAction - Required permission action (READ, WRITE, DELETE, etc.)
   * @returns Effect that succeeds if permission granted, fails with PermissionDenied if denied
   */
  checkPermission(
    userContext: UserContext,
    documentId: string,
    requiredAction: PermissionAction
  ): Effect.Effect<void, UseCaseError, DatabaseService> {
    return pipe(
      // Fetch user, document, and policies in parallel
      Effect.all({
        user: this.userRepo.findById(userContext.userId),
        document: this.documentRepo.findById(documentId),
        policies: this.policyRepo.findByResource("document", documentId, {
          page: 1,
          limit: 1000, // Get all policies for this document
        }),
      }),
      Effect.mapError((repoError) => {
        if (repoError._tag === "UserNotFound") {
          return {
            _tag: "UserNotFound",
            userId: userContext.userId,
          } as UseCaseError;
        }
        if (repoError._tag === "DocumentNotFound") {
          return {
            _tag: "DocumentNotFound",
            documentId: documentId,
          } as UseCaseError;
        }
        return {
          _tag: "UseCaseUnknown",
          operation: "RBACService.checkPermission",
          message: `Repository error: ${repoError._tag}`,
        } as UseCaseError;
      }),
      // Convert to domain entities
      Effect.flatMap(({ user, document, policies }) =>
        pipe(
          Effect.all({
            userDomain: userPersistenceToDomain(user),
            documentDomain: documentPersistenceToDomain(document),
            policyDomains: Effect.all(
              policies.data.map((p) => policyPersistenceToDomain(p))
            ),
          }),
          // Evaluate permission using domain service
          Effect.flatMap(({ userDomain, documentDomain, policyDomains }) =>
            pipe(
              DocumentAccessService.evaluatePermission(
                userDomain,
                policyDomains,
                documentDomain,
                requiredAction
              ),
              Effect.mapError((domainError) => {
                // Map domain errors to use case errors
                if (domainError._tag === "UserNotActive") {
                  return {
                    _tag: "PermissionDenied",
                    userId: userContext.userId,
                    documentId: documentId,
                    action: requiredAction,
                  } as UseCaseError;
                }
                return {
                  _tag: "UseCaseUnknown",
                  operation: "RBACService.checkPermission",
                  message: `Domain error: ${domainError._tag}`,
                } as UseCaseError;
              }),
              // If permission denied, record audit log and return PermissionDenied error
              Effect.flatMap((hasPermission) => {
                if (!hasPermission) {
                  // Record audit log for permission denial (non-blocking)
                  if (this.auditService) {
                    this.auditService
                      .record(
                        "PERMISSION_DENIED",
                        userContext as AuditUserContext,
                        documentId,
                        {
                          action: requiredAction,
                          resourceType: "document",
                        }
                      )
                      .pipe(
                        Effect.catchAll((error) => {
                          logger.warn("Failed to record permission denied audit log", {
                            error: error.message || String(error),
                            userId: userContext.userId,
                            documentId,
                            action: requiredAction,
                          });
                          return Effect.succeed(undefined);
                        }),
                        Effect.provide(DatabaseService)
                      )
                      .then(() => {}) // Fire and forget
                      .catch(() => {}); // Ignore errors
                  }
                  
                  return Effect.fail({
                    _tag: "PermissionDenied",
                    userId: userContext.userId,
                    documentId: documentId,
                    action: requiredAction,
                  } as UseCaseError);
                }
                return Effect.succeed(undefined);
              })
            )
          )
        )
      )
    );
  }

  /**
   * Check multiple permissions at once
   * Returns PermissionDenied if any required permission is missing
   */
  checkPermissions(
    userContext: UserContext,
    documentId: string,
    requiredActions: PermissionAction[]
  ): Effect.Effect<void, UseCaseError, DatabaseService> {
    // Check all permissions in parallel
    return pipe(
      Effect.all(
        requiredActions.map((action) =>
          this.checkPermission(userContext, documentId, action)
        ),
        { concurrency: "unbounded" }
      ),
      Effect.map(() => undefined) // Discard results, just check all succeeded
    );
  }
}
