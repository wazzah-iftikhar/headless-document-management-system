/**
 * Test Database Helper
 * 
 * Provides a complete test database setup with migrations and seeding.
 * Handles setup and teardown for isolated test runs.
 */

import { startTestDatabase, type TestDatabase as TestDbContainer } from "./testcontainers-setup";
import { migrateUp, migrateDown, loadMigrations } from "./migration-runner";
import { seedAll, clearAll } from "./seed-scripts";
import { resetUuidSeed } from "../fixtures";

export interface TestDatabaseSetup {
  db: TestDbContainer["db"];
  container: TestDbContainer["container"];
  connectionString: string;
  sql: TestDbContainer["sql"];
  cleanup: () => Promise<void>;
  reseed: () => Promise<void>;
  clear: () => Promise<void>;
}

export interface TestDatabaseOptions {
  runMigrations?: boolean;
  seedData?: boolean;
  seedOptions?: {
    documentCount?: number;
    userCount?: number;
    policyCount?: number;
    versionCountPerDocument?: number;
  };
}

/**
 * Setup a test database with migrations and optional seeding
 * 
 * @param options - Configuration options for database setup
 * @returns TestDatabaseSetup instance with database connection and cleanup functions
 */
export async function setupTestDatabase(
  options: TestDatabaseOptions = {}
): Promise<TestDatabaseSetup> {
  const {
    runMigrations = true,
    seedData = true,
    seedOptions = {},
  } = options;

  // Reset UUID seed for deterministic test data
  resetUuidSeed();

  // Start test container
  const testDb = await startTestDatabase();

  try {
    // Run migrations if requested
    if (runMigrations) {
      const migrations = await loadMigrations();
      await migrateUp(testDb.db, migrations);
    }

    // Seed data if requested
    if (seedData) {
      await seedAll(testDb.db, seedOptions);
    }

    return {
      db: testDb.db,
      container: testDb.container,
      connectionString: testDb.connectionString,
      sql: testDb.sql,
      cleanup: async () => {
        await clearAll(testDb.db);
        await testDb.stop();
      },
      reseed: async () => {
        await clearAll(testDb.db);
        resetUuidSeed();
        await seedAll(testDb.db, seedOptions);
      },
      clear: async () => {
        await clearAll(testDb.db);
      },
    };
  } catch (error) {
    // Cleanup on error
    await testDb.stop();
    throw error;
  }
}

/**
 * Setup a test database with migrations only (no seeding)
 */
export async function setupTestDatabaseWithoutSeeding(): Promise<TestDatabaseSetup> {
  return setupTestDatabase({
    runMigrations: true,
    seedData: false,
  });
}

/**
 * Setup a test database with migrations and custom seed data
 */
export async function setupTestDatabaseWithCustomSeed(
  seedOptions: TestDatabaseOptions["seedOptions"]
): Promise<TestDatabaseSetup> {
  return setupTestDatabase({
    runMigrations: true,
    seedData: true,
    seedOptions,
  });
}

/**
 * Teardown test database
 * 
 * @param setup - TestDatabaseSetup instance to teardown
 */
export async function teardownTestDatabase(
  setup: TestDatabaseSetup
): Promise<void> {
  await setup.cleanup();
}

/**
 * Create a fresh test database for each test (for maximum isolation)
 * 
 * This is useful for tests that need complete isolation.
 * Note: This is slower than reusing a database, but provides better isolation.
 */
export async function createIsolatedTestDatabase(
  options: TestDatabaseOptions = {}
): Promise<TestDatabaseSetup> {
  return setupTestDatabase(options);
}
