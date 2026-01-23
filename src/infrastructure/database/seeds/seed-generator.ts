import { Effect, pipe } from "effect";
import { DatabaseService } from "../../../effect/services/database.service";
import { DocumentRepositoryImpl } from "../../repositories/implementations/document.repository.impl";
import { UserRepositoryImpl } from "../../repositories/implementations/user.repository.impl";
import { AccessPolicyRepositoryImpl } from "../../repositories/implementations/access-policy.repository.impl";
import { DocumentVersionRepositoryImpl } from "../../repositories/implementations/document-version.repository.impl";
import type { DocumentPersistence } from "../../../domain/document/document.entity.schema";
import type { UserPersistence } from "../../../domain/user/user.entity.schema";
import type { AccessPolicyPersistence } from "../../../domain/access-policy/access-policy.entity.schema";
import type { DocumentVersionPersistence } from "../../../domain/document/document-version.entity.schema";

/**
 * Seed Data Generator
 * 
 * Creates deterministic seed datasets for integration testing.
 * Works directly with persistence types for simplicity in tests.
 */
export class SeedDataGenerator {
  private documentRepo = new DocumentRepositoryImpl();
  private userRepo = new UserRepositoryImpl();
  private accessPolicyRepo = new AccessPolicyRepositoryImpl();
  private documentVersionRepo = new DocumentVersionRepositoryImpl();

  // Fixed UUIDs for deterministic testing
  private static readonly FIXED_USER_ID_1 = "00000000-0000-4000-8000-000000000001";
  private static readonly FIXED_USER_ID_2 = "00000000-0000-4000-8000-000000000002";
  private static readonly FIXED_USER_ID_3 = "00000000-0000-4000-8000-000000000003";
  private static readonly FIXED_USER_ID_4 = "00000000-0000-4000-8000-000000000004";
  private static readonly FIXED_DOCUMENT_ID_1 = "00000000-0000-4000-8000-000000000100";
  private static readonly FIXED_DOCUMENT_ID_2 = "00000000-0000-4000-8000-000000000101";
  private static readonly FIXED_DOCUMENT_ID_3 = "00000000-0000-4000-8000-000000000102";
  private static readonly FIXED_WORKSPACE_ID = "00000000-0000-4000-8000-000000000010";
  private static readonly FIXED_POLICY_ID_1 = "00000000-0000-4000-8000-000000001000";
  private static readonly FIXED_POLICY_ID_2 = "00000000-0000-4000-8000-000000001001";

  /**
   * Generate and insert seed documents
   */
  private seedDocuments(): Effect.Effect<void, any, DatabaseService> {
    const documents: Omit<DocumentPersistence, "id" | "createdAt" | "updatedAt">[] = [
      {
        filename: "test-document-1.pdf",
        originalFilename: "test-document-1.pdf",
        filePath: "/uploads/test-document-1.pdf",
        fileSize: 1024,
        checksum: undefined,
        metadataTags: JSON.stringify(["test", "document"]),
      },
      {
        filename: "invoice-2024.pdf",
        originalFilename: "invoice-2024.pdf",
        filePath: "/uploads/invoice-2024.pdf",
        fileSize: 2048,
        checksum: "a".repeat(64), // Valid SHA-256 format
        metadataTags: JSON.stringify(["invoice", "2024"]),
      },
      {
        filename: "contract-legal.pdf",
        originalFilename: "contract-legal.pdf",
        filePath: "/uploads/contract-legal.pdf",
        fileSize: 5120,
        checksum: undefined,
        metadataTags: JSON.stringify(["contract", "legal"]),
      },
      {
        filename: "large-file.pdf",
        originalFilename: "large-file.pdf",
        filePath: "/uploads/large-file.pdf",
        fileSize: 10 * 1024 * 1024, // 10MB
        checksum: undefined,
        metadataTags: JSON.stringify(["large"]),
      },
      {
        filename: "small-file.pdf",
        originalFilename: "small-file.pdf",
        filePath: "/uploads/small-file.pdf",
        fileSize: 100, // 100 bytes
        checksum: undefined,
        metadataTags: JSON.stringify([]),
      },
    ];

    return Effect.all(
      documents.map((doc) => this.documentRepo.create(doc))
    );
  }

  /**
   * Generate and insert seed users
   */
  private seedUsers(): Effect.Effect<void, any, DatabaseService> {
    const users: Omit<UserPersistence, "id" | "createdAt" | "updatedAt">[] = [
      {
        email: "admin@example.com",
        role: "admin",
        workspaceIds: JSON.stringify([SeedDataGenerator.FIXED_WORKSPACE_ID]),
        isActive: true,
      },
      {
        email: "manager@example.com",
        role: "manager",
        workspaceIds: JSON.stringify([SeedDataGenerator.FIXED_WORKSPACE_ID]),
        isActive: true,
      },
      {
        email: "editor@example.com",
        role: "editor",
        workspaceIds: JSON.stringify([SeedDataGenerator.FIXED_WORKSPACE_ID]),
        isActive: true,
      },
      {
        email: "viewer@example.com",
        role: "viewer",
        workspaceIds: JSON.stringify([SeedDataGenerator.FIXED_WORKSPACE_ID]),
        isActive: true,
      },
      {
        email: "inactive@example.com",
        role: "viewer",
        workspaceIds: JSON.stringify([SeedDataGenerator.FIXED_WORKSPACE_ID]),
        isActive: false,
      },
      {
        email: "multi-workspace@example.com",
        role: "editor",
        workspaceIds: JSON.stringify([
          SeedDataGenerator.FIXED_WORKSPACE_ID,
          "00000000-0000-4000-8000-000000000011",
        ]),
        isActive: true,
      },
    ];

    return Effect.all(
      users.map((user) => this.userRepo.create(user))
    ).pipe(Effect.map(() => undefined));
  }

  /**
   * Generate and insert seed access policies
   */
  private seedAccessPolicies(): Effect.Effect<void, any, DatabaseService> {
    const policies: Omit<AccessPolicyPersistence, "id" | "createdAt" | "updatedAt">[] = [
      {
        subjectType: "user",
        subjectId: SeedDataGenerator.FIXED_USER_ID_1,
        resourceType: "document",
        resourceId: null,
        actions: JSON.stringify(["manage"]),
        isActive: true,
      },
      {
        subjectType: "role",
        subjectId: "manager",
        resourceType: "document",
        resourceId: null,
        actions: JSON.stringify(["read", "write"]),
        isActive: true,
      },
      {
        subjectType: "role",
        subjectId: "editor",
        resourceType: "document",
        resourceId: null,
        actions: JSON.stringify(["read", "write"]),
        isActive: true,
      },
      {
        subjectType: "role",
        subjectId: "viewer",
        resourceType: "document",
        resourceId: null,
        actions: JSON.stringify(["read"]),
        isActive: true,
      },
      {
        subjectType: "user",
        subjectId: SeedDataGenerator.FIXED_USER_ID_2,
        resourceType: "document",
        resourceId: SeedDataGenerator.FIXED_DOCUMENT_ID_1,
        actions: JSON.stringify(["read", "write"]),
        isActive: true,
      },
      {
        subjectType: "workspace",
        subjectId: SeedDataGenerator.FIXED_WORKSPACE_ID,
        resourceType: "document",
        resourceId: null,
        actions: JSON.stringify(["read", "share"]),
        isActive: true,
      },
    ];

    return Effect.all(
      policies.map((policy) => this.accessPolicyRepo.create(policy))
    ).pipe(Effect.map(() => undefined));
  }

  /**
   * Generate and insert seed document versions
   * Uses the first created document's ID
   */
  private seedDocumentVersions(documentId: string): Effect.Effect<void, any, DatabaseService> {
    const versions: Omit<DocumentVersionPersistence, "id" | "createdAt">[] = [];

    // Create versions 1-5 for the first document
    for (let versionNumber = 1; versionNumber <= 5; versionNumber++) {
      versions.push({
        documentId,
        versionNumber,
      });
    }

    return Effect.all(
      versions.map((version) => this.documentVersionRepo.create(version))
    ).pipe(Effect.map(() => undefined));
  }

  /**
   * Generate all seed data
   */
  seedAll(): Effect.Effect<void, any, DatabaseService> {
    return pipe(
      this.seedUsers(),
      Effect.flatMap(() => this.seedDocuments()),
      Effect.flatMap((documents) => {
        // Use the first document's ID for versions
        const firstDocumentId = documents[0]?.id;
        if (!firstDocumentId) {
          return Effect.succeed(undefined);
        }
        return pipe(
          this.seedAccessPolicies(),
          Effect.flatMap(() => this.seedDocumentVersions(firstDocumentId))
        );
      })
    );
  }

  /**
   * Clear all seed data (for test cleanup)
   */
  clearAll(): Effect.Effect<void, any, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            // Delete in reverse order of dependencies
            await db.execute(`DELETE FROM document_versions`);
            await db.execute(`DELETE FROM access_policies`);
            await db.execute(`DELETE FROM documents`);
            await db.execute(`DELETE FROM users`);
          },
          catch: (error) => error as Error,
        })
      ),
      Effect.map(() => undefined)
    );
  }
}

/**
 * Create a seed data generator instance
 */
export function createSeedGenerator(): SeedDataGenerator {
  return new SeedDataGenerator();
}
