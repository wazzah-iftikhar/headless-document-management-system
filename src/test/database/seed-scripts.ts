/**
 * Seed Scripts for Test Database
 * 
 * Provides seed data generation for test databases.
 * Uses test fixtures for consistent, deterministic test data.
 */

import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import {
  createDocumentPersistenceList,
  createUserPersistenceList,
  createAccessPolicyPersistenceList,
  createDocumentVersionPersistenceList,
} from "../fixtures";
import { resetUuidSeed } from "../fixtures";

export type TestDatabase = PostgresJsDatabase<any> | BunSQLiteDatabase<any>;

/**
 * Check if database is PostgreSQL
 */
function isPostgres(db: TestDatabase): boolean {
  return "execute" in db && typeof (db as any).execute === "function";
}

/**
 * Seed documents into the test database
 */
export async function seedDocuments(
  db: TestDatabase,
  count: number = 5
): Promise<void> {
  resetUuidSeed();
  const documents = createDocumentPersistenceList(count);

  const isPostgresDb = isPostgres(db);

  for (const doc of documents) {
    if (isPostgresDb) {
      await db.execute(sql`
        INSERT INTO documents (
          id, filename, original_filename, file_path, file_size, checksum, metadata_tags, created_at, updated_at
        ) VALUES (
          ${doc.id},
          ${doc.filename},
          ${doc.originalFilename},
          ${doc.filePath},
          ${doc.fileSize},
          ${doc.checksum ?? null},
          ${doc.metadataTags},
          ${doc.createdAt},
          ${doc.updatedAt}
        )
      `);
    } else {
      await db.execute(sql`
        INSERT INTO documents (
          id, filename, original_filename, file_path, file_size, checksum, metadata_tags, created_at, updated_at
        ) VALUES (
          ${doc.id},
          ${doc.filename},
          ${doc.originalFilename},
          ${doc.filePath},
          ${doc.fileSize},
          ${doc.checksum ?? null},
          ${doc.metadataTags},
          ${doc.createdAt},
          ${doc.updatedAt}
        )
      `);
    }
  }
}

/**
 * Seed users into the test database
 */
export async function seedUsers(
  db: TestDatabase,
  count: number = 5
): Promise<void> {
  resetUuidSeed();
  const users = createUserPersistenceList(count);

  const isPostgresDb = isPostgres(db);

  for (const user of users) {
    if (isPostgresDb) {
      await db.execute(sql`
        INSERT INTO users (
          id, email, role, workspace_ids, is_active, created_at, updated_at
        ) VALUES (
          ${user.id},
          ${user.email},
          ${user.role},
          ${user.workspaceIds},
          ${user.isActive},
          ${user.createdAt},
          ${user.updatedAt}
        )
      `);
    } else {
      await db.execute(sql`
        INSERT INTO users (
          id, email, role, workspace_ids, is_active, created_at, updated_at
        ) VALUES (
          ${user.id},
          ${user.email},
          ${user.role},
          ${user.workspaceIds},
          ${user.isActive ? "1" : "0"},
          ${user.createdAt},
          ${user.updatedAt}
        )
      `);
    }
  }
}

/**
 * Seed access policies into the test database
 */
export async function seedAccessPolicies(
  db: TestDatabase,
  count: number = 5
): Promise<void> {
  resetUuidSeed();
  const policies = createAccessPolicyPersistenceList(count);

  const isPostgresDb = isPostgres(db);

  for (const policy of policies) {
    if (isPostgresDb) {
      await db.execute(sql`
        INSERT INTO access_policies (
          id, subject_type, subject_id, resource_type, resource_id, actions, is_active, created_at, updated_at
        ) VALUES (
          ${policy.id},
          ${policy.subjectType},
          ${policy.subjectId},
          ${policy.resourceType},
          ${policy.resourceId ?? null},
          ${policy.actions},
          ${policy.isActive},
          ${policy.createdAt},
          ${policy.updatedAt}
        )
      `);
    } else {
      await db.execute(sql`
        INSERT INTO access_policies (
          id, subject_type, subject_id, resource_type, resource_id, actions, is_active, created_at, updated_at
        ) VALUES (
          ${policy.id},
          ${policy.subjectType},
          ${policy.subjectId},
          ${policy.resourceType},
          ${policy.resourceId ?? null},
          ${policy.actions},
          ${policy.isActive ? "1" : "0"},
          ${policy.createdAt},
          ${policy.updatedAt}
        )
      `);
    }
  }
}

/**
 * Seed document versions into the test database
 */
export async function seedDocumentVersions(
  db: TestDatabase,
  documentId: string,
  versionCount: number = 3
): Promise<void> {
  resetUuidSeed();
  const versions = createDocumentVersionPersistenceList(versionCount, {
    documentId,
  });

  const isPostgresDb = isPostgres(db);

  for (const version of versions) {
    if (isPostgresDb) {
      await db.execute(sql`
        INSERT INTO document_versions (
          id, document_id, version_number, created_at, updated_at
        ) VALUES (
          ${version.id},
          ${version.documentId},
          ${version.versionNumber},
          ${version.createdAt},
          ${version.createdAt}
        )
      `);
    } else {
      await db.execute(sql`
        INSERT INTO document_versions (
          id, document_id, version_number, created_at, updated_at
        ) VALUES (
          ${version.id},
          ${version.documentId},
          ${version.versionNumber},
          ${version.createdAt},
          ${version.createdAt}
        )
      `);
    }
  }
}

/**
 * Seed all test data
 */
export async function seedAll(
  db: TestDatabase,
  options: {
    documentCount?: number;
    userCount?: number;
    policyCount?: number;
    versionCountPerDocument?: number;
  } = {}
): Promise<{ documentIds: string[]; userIds: string[] }> {
  const {
    documentCount = 5,
    userCount = 5,
    policyCount = 5,
    versionCountPerDocument = 3,
  } = options;

  // Reset seed for deterministic data
  resetUuidSeed();

  // Seed in dependency order
  await seedUsers(db, userCount);
  await seedDocuments(db, documentCount);
  await seedAccessPolicies(db, policyCount);

  // Get document IDs for versions
  const isPostgresDb = isPostgres(db);
  let documentIds: string[] = [];

  if (isPostgresDb) {
    const docs = await db.execute<{ id: string }>(
      sql`SELECT id FROM documents ORDER BY created_at LIMIT ${documentCount}`
    );
    documentIds = Array.isArray(docs) ? docs.map((d) => d.id) : [];
  } else {
    const docs = await db.execute<{ id: string }>(
      sql`SELECT id FROM documents ORDER BY created_at LIMIT ${documentCount}`
    );
    documentIds = Array.isArray(docs) ? docs.map((d) => d.id) : [];
  }

  // Seed versions for first document
  if (documentIds.length > 0) {
    await seedDocumentVersions(db, documentIds[0], versionCountPerDocument);
  }

  // Get user IDs
  let userIds: string[] = [];
  if (isPostgresDb) {
    const users = await db.execute<{ id: string }>(
      sql`SELECT id FROM users ORDER BY created_at LIMIT ${userCount}`
    );
    userIds = Array.isArray(users) ? users.map((u) => u.id) : [];
  } else {
    const users = await db.execute<{ id: string }>(
      sql`SELECT id FROM users ORDER BY created_at LIMIT ${userCount}`
    );
    userIds = Array.isArray(users) ? users.map((u) => u.id) : [];
  }

  return { documentIds, userIds };
}

/**
 * Clear all seed data from test database
 */
export async function clearAll(db: TestDatabase): Promise<void> {
  const isPostgresDb = isPostgres(db);

  // Delete in reverse order of dependencies
  if (isPostgresDb) {
    await db.execute(sql`DELETE FROM document_versions`);
    await db.execute(sql`DELETE FROM access_policies`);
    await db.execute(sql`DELETE FROM documents`);
    await db.execute(sql`DELETE FROM users`);
  } else {
    await db.execute(sql`DELETE FROM document_versions`);
    await db.execute(sql`DELETE FROM access_policies`);
    await db.execute(sql`DELETE FROM documents`);
    await db.execute(sql`DELETE FROM users`);
  }
}
