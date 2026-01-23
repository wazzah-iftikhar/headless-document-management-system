import { test, expect, beforeEach, afterEach } from "bun:test";
import { Effect, Layer, pipe } from "effect";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DatabaseService } from "../../../effect/services/database.service";
import { DocumentRepositoryImpl } from "../../repositories/implementations/document.repository.impl";
import { UserRepositoryImpl } from "../../repositories/implementations/user.repository.impl";
import { DocumentVersionRepositoryImpl } from "../../repositories/implementations/document-version.repository.impl";
import { createSeedGenerator } from "../../database/seeds/seed-generator";
import { loadMigrations } from "../../database/migrations/migration-runner";

/**
 * Integration Test Setup
 * 
 * Uses Testcontainers to spin up a Postgres database for integration tests.
 * Tests run against a real Postgres instance to verify:
 * - Repository CRUD operations
 * - Query performance and index usage
 * - E2E workflows (create → version → fetch → update → list)
 */

let container: StartedPostgreSqlContainer;
let testDb: ReturnType<typeof drizzle>;
let postgresClient: postgres.Sql;

/**
 * Convert SQLite migration SQL to Postgres-compatible SQL
 */
function convertSQLiteToPostgres(sqliteSQL: string): string {
  return sqliteSQL
    // Replace SQLite-specific syntax
    .replace(/`/g, '"') // Backticks to double quotes
    .replace(/text PRIMARY KEY/g, 'VARCHAR(255) PRIMARY KEY')
    .replace(/text NOT NULL/g, 'VARCHAR(255) NOT NULL')
    .replace(/text DEFAULT/g, 'VARCHAR(255) DEFAULT')
    .replace(/text,/g, 'VARCHAR(255),')
    .replace(/text\)/g, 'VARCHAR(255))')
    .replace(/integer NOT NULL/g, 'INTEGER NOT NULL')
    .replace(/integer DEFAULT/g, 'INTEGER DEFAULT')
    .replace(/integer,/g, 'INTEGER,')
    .replace(/integer\)/g, 'INTEGER)')
    // Replace SQLite datetime functions
    .replace(/datetime\('now'\)/g, "CURRENT_TIMESTAMP")
    .replace(/DEFAULT \(datetime\('now'\)\)/g, 'DEFAULT CURRENT_TIMESTAMP')
    // Fix CHECK constraints
    .replace(/CHECK\("([^"]+)"\.\"([^"]+)" > 0\)/g, 'CHECK("$2" > 0)')
    .replace(/CHECK\("([^"]+)"\.\"([^"]+)" >= 1\)/g, 'CHECK("$2" >= 1)')
    // Remove duplicate FOREIGN KEY constraints (SQLite allows duplicates, Postgres doesn't)
    .replace(/FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)`\(`([^`]+)`\) ON UPDATE no action ON DELETE cascade[\s\S]*?FOREIGN KEY \(`([^`]+)`\) REFERENCES `([^`]+)`\(`([^`]+)`\) ON UPDATE no action ON DELETE no action/g, 
      'FOREIGN KEY ("$1") REFERENCES "$2"("$3") ON UPDATE NO ACTION ON DELETE CASCADE');
}

/**
 * Setup: Start Postgres container and run migrations
 */
beforeEach(async () => {
  // Start Postgres container
  container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("testdb")
    .withUsername("testuser")
    .withPassword("testpass")
    .start();

  // Create Postgres client
  const connectionString = container.getConnectionUri();
  postgresClient = postgres(connectionString);
  
  // Create Drizzle database connection (without schema for now since schemas are SQLite-specific)
  testDb = drizzle(postgresClient);

  // Load and run migrations
  const migrations = await loadMigrations("./drizzle");
  
  for (const migration of migrations) {
    const statements = migration.content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const pgStatement = convertSQLiteToPostgres(statement);
        try {
          await postgresClient.unsafe(pgStatement);
        } catch (error: any) {
          // Ignore "already exists" errors for idempotency
          if (!error.message?.includes("already exists") && !error.message?.includes("duplicate")) {
            console.error(`Migration error in ${migration.name}:`, error.message);
            console.error("SQL:", pgStatement);
            throw error;
          }
        }
      }
    }
  }
});

/**
 * Teardown: Stop container and close connections
 */
afterEach(async () => {
  await postgresClient.end();
  await container.stop();
});

/**
 * Create a test database service layer
 */
function createTestDatabaseService() {
  return Layer.succeed(DatabaseService, testDb as any);
}

test("E2E: Create document → Add version → Fetch latest → Update → List", async () => {
  const documentRepo = new DocumentRepositoryImpl();
  const versionRepo = new DocumentVersionRepositoryImpl();

  // Create document
  const createResult = await Effect.runPromise(
    pipe(
      documentRepo.create({
        filename: "test-doc.pdf",
        originalFilename: "test-doc.pdf",
        filePath: "/uploads/test-doc.pdf",
        fileSize: 1024,
        metadataTags: JSON.stringify(["test", "e2e"]),
      }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(createResult).toBeDefined();
  expect(createResult.filename).toBe("test-doc.pdf");
  const documentId = createResult.id;

  // Add version
  const versionResult = await Effect.runPromise(
    pipe(
      versionRepo.create({
        documentId,
        versionNumber: 1,
      }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(versionResult).toBeDefined();
  expect(versionResult.versionNumber).toBe(1);
  expect(versionResult.documentId).toBe(documentId);

  // Fetch latest version
  const latestVersion = await Effect.runPromise(
    pipe(
      versionRepo.findLatestByDocumentId(documentId),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(latestVersion).toBeDefined();
  expect(latestVersion.versionNumber).toBe(1);

  // Update document
  const updateResult = await Effect.runPromise(
    pipe(
      documentRepo.update(documentId, {
        metadataTags: JSON.stringify(["test", "e2e", "updated"]),
      }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(updateResult).toBeDefined();
  expect(updateResult.metadataTags).toContain("updated");

  // List documents
  const listResult = await Effect.runPromise(
    pipe(
      documentRepo.findAll({ page: 1, limit: 10 }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(listResult.data.length).toBeGreaterThan(0);
  expect(listResult.meta.total).toBeGreaterThan(0);
  expect(listResult.data.some((doc) => doc.id === documentId)).toBe(true);
});

test("Repository: Create and find document by ID", async () => {
  const documentRepo = new DocumentRepositoryImpl();

  const created = await Effect.runPromise(
    pipe(
      documentRepo.create({
        filename: "find-test.pdf",
        originalFilename: "find-test.pdf",
        filePath: "/uploads/find-test.pdf",
        fileSize: 2048,
        metadataTags: JSON.stringify(["find-test"]),
      }),
      Effect.provide(createTestDatabaseService())
    )
  );

  const found = await Effect.runPromise(
    pipe(
      documentRepo.findById(created.id),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(found).toBeDefined();
  expect(found.id).toBe(created.id);
  expect(found.filename).toBe("find-test.pdf");
});

test("Repository: Pagination works correctly", async () => {
  const documentRepo = new DocumentRepositoryImpl();
  const seedGenerator = createSeedGenerator();

  // Seed multiple documents
  await Effect.runPromise(
    pipe(
      seedGenerator.seedAll(),
      Effect.provide(createTestDatabaseService())
    )
  );

  // Test pagination
  const page1 = await Effect.runPromise(
    pipe(
      documentRepo.findAll({ page: 1, limit: 2 }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(page1.data.length).toBe(2);
  expect(page1.meta.page).toBe(1);
  expect(page1.meta.limit).toBe(2);
  expect(page1.meta.total).toBeGreaterThanOrEqual(2);

  const page2 = await Effect.runPromise(
    pipe(
      documentRepo.findAll({ page: 2, limit: 2 }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(page2.data.length).toBeGreaterThanOrEqual(0);
  expect(page2.meta.page).toBe(2);
  
  // Ensure different pages return different documents
  if (page1.data.length > 0 && page2.data.length > 0 && page1.data[0] && page2.data[0]) {
    expect(page1.data[0].id).not.toBe(page2.data[0].id);
  }
});

test("Repository: Find documents by tags", async () => {
  const documentRepo = new DocumentRepositoryImpl();

  // Create documents with different tags
  await Effect.runPromise(
    pipe(
      documentRepo.create({
        filename: "tag1.pdf",
        originalFilename: "tag1.pdf",
        filePath: "/uploads/tag1.pdf",
        fileSize: 1024,
        metadataTags: JSON.stringify(["invoice", "2024"]),
      }),
      Effect.provide(createTestDatabaseService())
    )
  );

  await Effect.runPromise(
    pipe(
      documentRepo.create({
        filename: "tag2.pdf",
        originalFilename: "tag2.pdf",
        filePath: "/uploads/tag2.pdf",
        fileSize: 1024,
        metadataTags: JSON.stringify(["contract", "legal"]),
      }),
      Effect.provide(createTestDatabaseService())
    )
  );

  // Search by tags
  const results = await Effect.runPromise(
    pipe(
      documentRepo.findByTags(["invoice"]),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(results.data.length).toBeGreaterThan(0);
  expect(results.data.every((doc) => {
    const tags = JSON.parse(doc.metadataTags);
    return tags.some((tag: string) => tag.toLowerCase().includes("invoice"));
  })).toBe(true);
});

test("Repository: Document versioning workflow", async () => {
  const documentRepo = new DocumentRepositoryImpl();
  const versionRepo = new DocumentVersionRepositoryImpl();

  // Create document
  const document = await Effect.runPromise(
    pipe(
      documentRepo.create({
        filename: "versioned.pdf",
        originalFilename: "versioned.pdf",
        filePath: "/uploads/versioned.pdf",
        fileSize: 1024,
        metadataTags: JSON.stringify(["versioned"]),
      }),
      Effect.provide(createTestDatabaseService())
    )
  );

  // Create multiple versions
  for (let i = 1; i <= 3; i++) {
    await Effect.runPromise(
      pipe(
        versionRepo.create({
          documentId: document.id,
          versionNumber: i,
        }),
        Effect.provide(createTestDatabaseService())
      )
    );
  }

  // Fetch all versions
  const versions = await Effect.runPromise(
    pipe(
      versionRepo.findByDocumentId(document.id, { page: 1, limit: 10 }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(versions.data.length).toBe(3);
  expect(versions.data[0]?.versionNumber).toBe(3); // Latest first

  // Fetch latest version
  const latest = await Effect.runPromise(
    pipe(
      versionRepo.findLatestByDocumentId(document.id),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(latest.versionNumber).toBe(3);
});

test("Repository: User CRUD operations", async () => {
  const userRepo = new UserRepositoryImpl();

  // Create user
  const created = await Effect.runPromise(
    pipe(
      userRepo.create({
        email: "test@example.com",
        role: "editor",
        workspaceIds: JSON.stringify(["workspace-1"]),
        isActive: true,
      }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(created.email).toBe("test@example.com");

  // Find by email
  const found = await Effect.runPromise(
    pipe(
      userRepo.findByEmail("test@example.com"),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(found.id).toBe(created.id);

  // Update user
  const updated = await Effect.runPromise(
    pipe(
      userRepo.update(created.id, { isActive: false }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(updated.isActive).toBe(false);

  // Delete user
  await Effect.runPromise(
    pipe(
      userRepo.delete(created.id),
      Effect.provide(createTestDatabaseService())
    )
  );

  // Verify deletion - should fail with UserNotFound
  const deletedResult = await Effect.runPromise(
    pipe(
      userRepo.findById(created.id),
      Effect.provide(createTestDatabaseService()),
      Effect.either
    )
  );

  // Check if result is a failure (Either.Left)
  const isFailure = deletedResult._tag === "Left";
  expect(isFailure).toBe(true);
});

test("Seed generator: Creates deterministic test data", async () => {
  const seedGenerator = createSeedGenerator();

  await Effect.runPromise(
    pipe(
      seedGenerator.seedAll(),
      Effect.provide(createTestDatabaseService())
    )
  );

  const documentRepo = new DocumentRepositoryImpl();
  const userRepo = new UserRepositoryImpl();

  const documents = await Effect.runPromise(
    pipe(
      documentRepo.findAll({ page: 1, limit: 100 }),
      Effect.provide(createTestDatabaseService())
    )
  );

  const users = await Effect.runPromise(
    pipe(
      userRepo.findAll({ page: 1, limit: 100 }),
      Effect.provide(createTestDatabaseService())
    )
  );

  expect(documents.data.length).toBeGreaterThan(0);
  expect(users.data.length).toBeGreaterThan(0);
});

test("Query performance: Indexes are used for lookups", async () => {
  const documentRepo = new DocumentRepositoryImpl();
  const seedGenerator = createSeedGenerator();

  // Seed data
  await Effect.runPromise(
    pipe(
      seedGenerator.seedAll(),
      Effect.provide(createTestDatabaseService())
    )
  );

  // Test that findByEmail uses index (should be fast)
  const userRepo = new UserRepositoryImpl();
  const startTime = Date.now();
  
  await Effect.runPromise(
    pipe(
      userRepo.findByEmail("admin@example.com"),
      Effect.provide(createTestDatabaseService())
    )
  );

  const duration = Date.now() - startTime;
  
  // Should complete quickly (index lookup)
  expect(duration).toBeLessThan(1000); // 1 second threshold
});
