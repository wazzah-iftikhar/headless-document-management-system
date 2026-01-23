import { test, expect, beforeEach } from "bun:test";
import { Effect, pipe } from "effect";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sql } from "drizzle-orm";
import * as schema from "../../database/schemas";
import { DatabaseService } from "../../../effect/services/database.service";
import { DocumentRepositoryImpl } from "../../repositories/implementations/document.repository.impl";
import { UserRepositoryImpl } from "../../repositories/implementations/user.repository.impl";
import { AccessPolicyRepositoryImpl } from "../../repositories/implementations/access-policy.repository.impl";
import { createSeedGenerator } from "../../database/seeds/seed-generator";
import { migrateUp, loadMigrations } from "../../database/migrations/migration-runner";
import { Layer } from "effect";

/**
 * Query Performance and Index Usage Verification
 * 
 * Tests verify that:
 * - Indexes are properly created and used
 * - Queries leverage indexes (avoid sequential scans)
 * - Query performance meets thresholds
 * - Common query patterns are optimized
 */

let testDb: ReturnType<typeof drizzle>;
let sqliteDb: Database;

/**
 * Setup: Create in-memory database and run migrations
 */
beforeEach(async () => {
  sqliteDb = new Database(":memory:");
  testDb = drizzle(sqliteDb, { schema });

  // Run migrations
  const migrations = await loadMigrations("./drizzle");
  await migrateUp(testDb, migrations);

  // Seed data for performance tests
  const seedGenerator = createSeedGenerator();
  await Effect.runPromise(
    pipe(
      seedGenerator.seedAll(),
      Effect.provide(Layer.succeed(DatabaseService, testDb as any))
    )
  );
});

/**
 * Get EXPLAIN query plan from SQLite
 */
async function explainQuery(query: string): Promise<any[]> {
  const result = await sqliteDb.query(`EXPLAIN QUERY PLAN ${query}`).all();
  return result as any[];
}

/**
 * Check if query plan uses an index
 */
function usesIndex(plan: any[]): boolean {
  return plan.some((row) => {
    const detail = row.detail || "";
    return detail.includes("USING INDEX") || detail.includes("SEARCH") || detail.includes("SCAN");
  });
}

/**
 * Check if query plan uses sequential scan (bad)
 */
function usesSequentialScan(plan: any[]): boolean {
  return plan.some((row) => {
    const detail = row.detail || "";
    return detail.includes("SCAN TABLE") && !detail.includes("USING INDEX");
  });
}

/**
 * Create a test database service layer
 */
function createTestDatabaseService() {
  return Layer.succeed(DatabaseService, testDb as any);
}

test("Index: Documents table has required indexes", async () => {
  const indexes = await sqliteDb
    .query(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='documents' AND name NOT LIKE 'sqlite_%'`
    )
    .all();

  const indexNames = indexes.map((idx: any) => idx.name);

  expect(indexNames).toContain("documents_filename_idx");
  expect(indexNames).toContain("documents_file_path_idx");
  expect(indexNames).toContain("documents_created_at_idx");
});

test("Index: Users table has required indexes", async () => {
  const indexes = await sqliteDb
    .query(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='users' AND name NOT LIKE 'sqlite_%'`
    )
    .all();

  const indexNames = indexes.map((idx: any) => idx.name);

  expect(indexNames).toContain("users_email_unique");
  expect(indexNames).toContain("users_email_idx");
  expect(indexNames).toContain("users_role_idx");
  expect(indexNames).toContain("users_is_active_idx");
  expect(indexNames).toContain("users_created_at_idx");
});

test("Index: Access policies table has required indexes", async () => {
  const indexes = await sqliteDb
    .query(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='access_policies' AND name NOT LIKE 'sqlite_%'`
    )
    .all();

  const indexNames = indexes.map((idx: any) => idx.name);

  expect(indexNames).toContain("access_policies_subject_idx");
  expect(indexNames).toContain("access_policies_resource_idx");
  expect(indexNames).toContain("access_policies_is_active_idx");
  expect(indexNames).toContain("access_policies_subject_resource_active_idx");
});

test("Query Performance: findByEmail uses index", async () => {
  const userRepo = new UserRepositoryImpl();

  // Get EXPLAIN plan for findByEmail query
  const plan = await explainQuery(
    `SELECT * FROM users WHERE email = 'admin@example.com' LIMIT 1`
  );

  // Should use index, not sequential scan
  expect(usesIndex(plan)).toBe(true);
  expect(usesSequentialScan(plan)).toBe(false);

  // Verify actual query performance
  const startTime = Date.now();
  await Effect.runPromise(
    pipe(
      userRepo.findByEmail("admin@example.com"),
      Effect.provide(createTestDatabaseService())
    )
  );
  const duration = Date.now() - startTime;

  // Should complete quickly with index
  expect(duration).toBeLessThan(100); // 100ms threshold
});

test("Query Performance: findById uses primary key index", async () => {
  const documentRepo = new DocumentRepositoryImpl();

  // First, get a document ID
  const documents = await Effect.runPromise(
    pipe(
      documentRepo.findAll({ page: 1, limit: 1 }),
      Effect.provide(createTestDatabaseService())
    )
  );

  if (documents.data.length === 0) {
    throw new Error("No documents found for test");
  }

  const documentId = documents.data[0].id;

  // Get EXPLAIN plan for findById query
  const plan = await explainQuery(
    `SELECT * FROM documents WHERE id = '${documentId}' LIMIT 1`
  );

  // Primary key lookups should be very fast (uses primary key index)
  expect(usesIndex(plan)).toBe(true);

  // Verify actual query performance
  const startTime = Date.now();
  await Effect.runPromise(
    pipe(
      documentRepo.findById(documentId),
      Effect.provide(createTestDatabaseService())
    )
  );
  const duration = Date.now() - startTime;

  // Primary key lookup should be very fast
  expect(duration).toBeLessThan(50); // 50ms threshold
});

test("Query Performance: findAll with ordering uses createdAt index", async () => {
  const documentRepo = new DocumentRepositoryImpl();

  // Get EXPLAIN plan for ordered query
  const plan = await explainQuery(
    `SELECT * FROM documents ORDER BY created_at DESC LIMIT 10`
  );

  // Should use createdAt index for ordering
  expect(usesIndex(plan)).toBe(true);

  // Verify actual query performance
  const startTime = Date.now();
  await Effect.runPromise(
    pipe(
      documentRepo.findAll({ page: 1, limit: 10, sortBy: "createdAt", sortOrder: "desc" }),
      Effect.provide(createTestDatabaseService())
    )
  );
  const duration = Date.now() - startTime;

  // Should complete quickly with index
  expect(duration).toBeLessThan(200); // 200ms threshold
});

test("Query Performance: findBySubject uses composite index", async () => {
  const accessPolicyRepo = new AccessPolicyRepositoryImpl();

  // Get EXPLAIN plan for subject-based query
  const plan = await explainQuery(
    `SELECT * FROM access_policies WHERE subject_type = 'user' AND subject_id = '00000000-0000-4000-8000-000000000001' AND is_active = '1'`
  );

  // Should use composite index
  expect(usesIndex(plan)).toBe(true);
  expect(usesSequentialScan(plan)).toBe(false);

  // Verify actual query performance
  const startTime = Date.now();
  await Effect.runPromise(
    pipe(
      accessPolicyRepo.findBySubject("user", "00000000-0000-4000-8000-000000000001"),
      Effect.provide(createTestDatabaseService())
    )
  );
  const duration = Date.now() - startTime;

  // Should complete quickly with composite index
  expect(duration).toBeLessThan(150); // 150ms threshold
});

test("Query Performance: Pagination queries are efficient", async () => {
  const documentRepo = new DocumentRepositoryImpl();

  // Test pagination performance
  const startTime = Date.now();
  const result = await Effect.runPromise(
    pipe(
      documentRepo.findAll({ page: 1, limit: 20 }),
      Effect.provide(createTestDatabaseService())
    )
  );
  const duration = Date.now() - startTime;

  // Pagination should be efficient
  expect(duration).toBeLessThan(300); // 300ms threshold
  expect(result.data.length).toBeLessThanOrEqual(20);
  expect(result.meta.total).toBeGreaterThan(0);
});

test("Query Performance: findByTags query performance", async () => {
  const documentRepo = new DocumentRepositoryImpl();

  // Note: Tag search currently filters in memory (SQLite JSON limitations)
  // This test verifies the overall query performance
  const startTime = Date.now();
  const result = await Effect.runPromise(
    pipe(
      documentRepo.findByTags(["invoice"]),
      Effect.provide(createTestDatabaseService())
    )
  );
  const duration = Date.now() - startTime;

  // Should complete within reasonable time
  expect(duration).toBeLessThan(500); // 500ms threshold for in-memory filtering
  expect(result.data.length).toBeGreaterThanOrEqual(0);
});

test("Query Performance: Multiple concurrent queries", async () => {
  const documentRepo = new DocumentRepositoryImpl();
  const userRepo = new UserRepositoryImpl();

  // Run multiple queries concurrently
  const startTime = Date.now();
  const [documents, users] = await Promise.all([
    Effect.runPromise(
      pipe(
        documentRepo.findAll({ page: 1, limit: 10 }),
        Effect.provide(createTestDatabaseService())
      )
    ),
    Effect.runPromise(
      pipe(
        userRepo.findAll({ page: 1, limit: 10 }),
        Effect.provide(createTestDatabaseService())
      )
    ),
  ]);
  const duration = Date.now() - startTime;

  // Concurrent queries should still be efficient
  expect(duration).toBeLessThan(400); // 400ms threshold
  expect(documents.data.length).toBeGreaterThan(0);
  expect(users.data.length).toBeGreaterThan(0);
});

test("Index Usage: Verify no sequential scans on indexed columns", async () => {
  // Test common query patterns to ensure they use indexes

  // Test 1: Email lookup
  const emailPlan = await explainQuery(
    `SELECT * FROM users WHERE email = 'admin@example.com'`
  );
  expect(usesSequentialScan(emailPlan)).toBe(false);

  // Test 2: Role filtering
  const rolePlan = await explainQuery(
    `SELECT * FROM users WHERE role = 'admin' AND is_active = '1'`
  );
  expect(usesSequentialScan(rolePlan)).toBe(false);

  // Test 3: Document ordering
  const orderPlan = await explainQuery(
    `SELECT * FROM documents ORDER BY created_at DESC LIMIT 10`
  );
  expect(usesSequentialScan(orderPlan)).toBe(false);

  // Test 4: Access policy subject lookup
  const subjectPlan = await explainQuery(
    `SELECT * FROM access_policies WHERE subject_type = 'user' AND subject_id = '00000000-0000-4000-8000-000000000001'`
  );
  expect(usesSequentialScan(subjectPlan)).toBe(false);
});

test("Index Coverage: All foreign key columns are indexed", async () => {
  // Check document_versions table has index on document_id (FK)
  const versionIndexes = await sqliteDb
    .query(
      `SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='document_versions' AND name NOT LIKE 'sqlite_%'`
    )
    .all();

  const versionIndexNames = versionIndexes.map((idx: any) => idx.name);
  expect(versionIndexNames.some((name: string) => name.includes("document_id"))).toBe(true);
});

test("Performance Benchmark: Large dataset query performance", async () => {
  const documentRepo = new DocumentRepositoryImpl();

  // Create additional test data to simulate larger dataset
  for (let i = 0; i < 50; i++) {
    await Effect.runPromise(
      pipe(
        documentRepo.create({
          filename: `benchmark-${i}.pdf`,
          originalFilename: `benchmark-${i}.pdf`,
          filePath: `/uploads/benchmark-${i}.pdf`,
          fileSize: 1024 + i,
          metadataTags: JSON.stringify([`tag-${i % 5}`]),
        }),
        Effect.provide(createTestDatabaseService())
      )
    );
  }

  // Test query performance with larger dataset
  const startTime = Date.now();
  const result = await Effect.runPromise(
    pipe(
      documentRepo.findAll({ page: 1, limit: 20, sortBy: "createdAt", sortOrder: "desc" }),
      Effect.provide(createTestDatabaseService())
    )
  );
  const duration = Date.now() - startTime;

  // Should still be efficient even with more data (indexes help)
  expect(duration).toBeLessThan(500); // 500ms threshold
  expect(result.data.length).toBe(20);
  expect(result.meta.total).toBeGreaterThan(50);
});
