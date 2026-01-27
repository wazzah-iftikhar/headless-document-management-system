/**
 * Testcontainers Setup for PostgreSQL Test Database
 * 
 * Provides isolated PostgreSQL database instances for integration testing.
 * Each test run gets a fresh database container.
 */

import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../infrastructure/database/schemas";

export interface TestDatabase {
  container: StartedPostgreSqlContainer;
  connectionString: string;
  sql: postgres.Sql;
  db: PostgresJsDatabase<typeof schema>;
  stop: () => Promise<void>;
}

/**
 * Start a PostgreSQL test container
 * 
 * @returns TestDatabase instance with connection and cleanup function
 */
export async function startTestDatabase(): Promise<TestDatabase> {
  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("test_db")
    .withUsername("test_user")
    .withPassword("test_password")
    .start();

  const connectionString = container.getConnectionString();
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });

  return {
    container,
    connectionString,
    sql,
    db,
    stop: async () => {
      await sql.end();
      await container.stop();
    },
  };
}

/**
 * Create a test database with a unique name for isolation
 */
export async function createIsolatedTestDatabase(): Promise<TestDatabase> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const databaseName = `test_db_${timestamp}_${randomSuffix}`;

  const container = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase(databaseName)
    .withUsername("test_user")
    .withPassword("test_password")
    .start();

  const connectionString = container.getConnectionString();
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql, { schema });

  return {
    container,
    connectionString,
    sql,
    db,
    stop: async () => {
      await sql.end();
      await container.stop();
    },
  };
}
