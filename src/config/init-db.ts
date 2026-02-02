import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sql } from "drizzle-orm";
import * as schema from "../infrastructure/database/schemas";
import { migrateUp, loadMigrations } from "../infrastructure/database/migrations/migration-runner";
import { logger } from "../infrastructure/services/logger.service";

/**
 * Initialize database schema using migrations
 * Creates tables using Drizzle migrations instead of manual SQL
 */
export async function initDatabase() {
  try {
    // Create database connection
    const sqlite = new Database("database.sqlite");
    const db = drizzle(sqlite, { schema });

    // Check if main tables already exist
    const tables = await db.all<{ name: string }[]>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'drizzle_migrations'`
    );

    const hasMainTables = tables.some(t => 
      ['documents', 'users', 'access_policies', 'document_versions'].includes(t.name)
    );

    if (hasMainTables) {
      // Tables exist, ensure migrations table exists and check if migrations are recorded
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS drizzle_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          hash TEXT NOT NULL,
          created_at INTEGER
        )
      `);
      
      const migrations = await loadMigrations("./drizzle");
      const recordedMigrations = await db.all<{ hash: string }[]>(
        sql`SELECT hash FROM drizzle_migrations`
      );
      const recordedHashes = new Set(recordedMigrations.map(m => m.hash));

      // Record any missing migrations as applied (since tables already exist)
      for (const migration of migrations) {
        if (!recordedHashes.has(migration.name)) {
          await db.run(
            sql`INSERT INTO drizzle_migrations (hash, created_at) VALUES (${migration.name}, ${Date.now()})`
          );
        }
      }
      logger.info("Database already initialized, migrations marked as applied", {
        operation: "initDatabase",
        migrationsCount: migrations.length,
      });
    } else {
      // No tables exist, run migrations normally
      const migrations = await loadMigrations("./drizzle");
      await migrateUp(db, migrations);
      logger.info("Database initialized successfully with migrations", {
        operation: "initDatabase",
        migrationsCount: migrations.length,
      });
    }

    // Close the connection (we'll create a new one when needed)
    sqlite.close();
  } catch (error) {
    logger.error("Database initialization failed", error instanceof Error ? error : new Error(String(error)), {
      operation: "initDatabase",
    });
    throw error;
  }
}
