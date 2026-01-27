/**
 * Test Database Utilities
 * 
 * Main entry point for test database setup and utilities.
 * 
 * Provides:
 * - Testcontainers setup for PostgreSQL
 * - Migration runner for test databases
 * - Seed scripts for test data
 * - Test database helper for complete setup/teardown
 * 
 * @example
 * ```typescript
 * import { setupTestDatabase, teardownTestDatabase } from "./test/database";
 * 
 * describe("Integration Tests", () => {
 *   let testDb: TestDatabaseSetup;
 * 
 *   beforeAll(async () => {
 *     testDb = await setupTestDatabase({
 *       runMigrations: true,
 *       seedData: true,
 *     });
 *   });
 * 
 *   afterAll(async () => {
 *     await teardownTestDatabase(testDb);
 *   });
 * 
 *   beforeEach(async () => {
 *     // Clear data between tests
 *     await testDb.clear();
 *     await testDb.reseed();
 *   });
 * 
 *   it("should work with test database", async () => {
 *     // Test implementation
 *   });
 * });
 * ```
 */

export * from "./testcontainers-setup";
export * from "./migration-runner";
export * from "./seed-scripts";
export * from "./test-database-helper";

export type {
  TestDatabaseSetup,
  TestDatabaseOptions,
} from "./test-database-helper";
