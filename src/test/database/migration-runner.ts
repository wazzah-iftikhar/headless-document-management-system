/**
 * Migration Runner for Test Database
 * 
 * Runs database migrations on the test database.
 * Supports both SQLite (for local dev) and PostgreSQL (for testcontainers).
 */

import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

export type TestDatabase = PostgresJsDatabase<any> | BunSQLiteDatabase<any>;

export interface MigrationFile {
  name: string;
  path: string;
  content: string;
}

/**
 * Load all migration files from the drizzle directory
 */
export async function loadMigrations(migrationsDir: string = "./drizzle"): Promise<MigrationFile[]> {
  try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter((file) => file.endsWith(".sql") && !file.startsWith("."))
      .sort(); // Sort to ensure correct order

    const migrations: MigrationFile[] = [];

    for (const file of sqlFiles) {
      const filePath = join(migrationsDir, file);
      const content = await readFile(filePath, "utf-8");
      migrations.push({
        name: file,
        path: filePath,
        content,
      });
    }

    return migrations;
  } catch (error) {
    // If migrations directory doesn't exist, return empty array
    console.warn(`Migration directory not found: ${migrationsDir}`);
    return [];
  }
}

/**
 * Split SQL migration content into individual statements
 * Handles both SQLite and PostgreSQL syntax
 */
function splitStatements(content: string, isPostgres: boolean): string[] {
  if (isPostgres) {
    // For PostgreSQL, split by semicolons (more reliable)
    return content
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));
  } else {
    // For SQLite, use statement breakpoint marker
    return content
      .split("--> statement-breakpoint")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));
  }
}

/**
 * Check if database is PostgreSQL
 */
function isPostgres(db: TestDatabase): boolean {
  // Check if it's a PostgresJsDatabase by checking the connection string or type
  // PostgresJsDatabase has different internal structure than BunSQLiteDatabase
  // SQLite databases have a "run" method, PostgreSQL databases don't
  return !("run" in db) && "execute" in db;
}

/**
 * Run migrations up (apply all migrations)
 * 
 * @param db - Database connection (PostgreSQL or SQLite)
 * @param migrations - Array of migration files
 */
export async function migrateUp(
  db: TestDatabase,
  migrations: MigrationFile[] = []
): Promise<void> {
  const isPostgresDb = isPostgres(db);
  
  // Create migrations table if it doesn't exist
  if (isPostgresDb) {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `);
  } else {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS drizzle_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hash TEXT NOT NULL,
        created_at INTEGER
      )
    `);
  }

  // Load migrations if not provided
  const migrationFiles = migrations.length > 0 
    ? migrations 
    : await loadMigrations();

  if (migrationFiles.length === 0) {
    console.warn("No migrations found. Creating tables from schema directly.");
    // If no migrations, we'll need to create tables from schema
    // This is handled by the schema setup
    return;
  }

  for (const migration of migrationFiles) {
    // Check if migration already applied
    const appliedResult = await db.execute<{ hash: string }>(
      sql`SELECT hash FROM drizzle_migrations WHERE hash = ${migration.name}`
    );

    const applied = Array.isArray(appliedResult) ? appliedResult : [];
    if (applied.length > 0) {
      continue; // Skip already applied migrations
    }

    // Split and execute statements
    const statements = splitStatements(migration.content, isPostgresDb);
    for (const statement of statements) {
      if (statement.trim()) {
        // Convert SQLite-specific syntax to PostgreSQL if needed
        let adaptedStatement = statement;
        if (isPostgresDb) {
          // Adapt SQLite syntax to PostgreSQL
          adaptedStatement = adaptSqliteToPostgres(statement);
        }
        await db.execute(sql.raw(adaptedStatement));
      }
    }

    // Record migration
    const timestamp = Date.now();
    if (isPostgresDb) {
      await db.execute(
        sql`INSERT INTO drizzle_migrations (hash, created_at) VALUES (${migration.name}, ${timestamp})`
      );
    } else {
      await db.execute(
        sql`INSERT INTO drizzle_migrations (hash, created_at) VALUES (${migration.name}, ${timestamp})`
      );
    }
  }
}

/**
 * Adapt SQLite SQL to PostgreSQL
 * Handles common differences between SQLite and PostgreSQL
 */
function adaptSqliteToPostgres(sql: string): string {
  let adapted = sql;

  // Replace INTEGER PRIMARY KEY AUTOINCREMENT with SERIAL PRIMARY KEY
  adapted = adapted.replace(
    /INTEGER PRIMARY KEY AUTOINCREMENT/gi,
    "SERIAL PRIMARY KEY"
  );

  // Replace AUTOINCREMENT with SERIAL
  adapted = adapted.replace(/AUTOINCREMENT/gi, "SERIAL");

  // Replace TEXT with VARCHAR or TEXT (PostgreSQL supports both)
  // Keep TEXT as is, but ensure proper quoting

  // Replace CURRENT_TIMESTAMP default (both support it, but ensure proper syntax)
  adapted = adapted.replace(
    /DEFAULT CURRENT_TIMESTAMP/gi,
    "DEFAULT CURRENT_TIMESTAMP"
  );

  // Remove SQLite-specific PRAGMA statements
  adapted = adapted.replace(/PRAGMA\s+\w+\s*=\s*\w+/gi, "");

  return adapted;
}

/**
 * Run migrations down (rollback all migrations)
 * 
 * Note: This drops all tables. For production, you'd want proper down migrations.
 */
export async function migrateDown(db: TestDatabase): Promise<void> {
  const isPostgresDb = isPostgres(db);

  if (isPostgresDb) {
    // Get all table names (PostgreSQL)
    const tables = await db.execute<{ tablename: string }>(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'drizzle_migrations'`
    );

    // Drop all tables
    for (const table of Array.isArray(tables) ? tables : []) {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table.tablename} CASCADE`));
    }
  } else {
    // Get all table names (SQLite)
    const tables = await db.execute<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'drizzle_migrations'`
    );

    // Drop all tables
    await db.execute(sql`PRAGMA foreign_keys = OFF`);
    for (const table of Array.isArray(tables) ? tables : []) {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS ${table.name}`));
    }
    await db.execute(sql`PRAGMA foreign_keys = ON`);
  }

  // Clear migrations table
  await db.execute(sql`DELETE FROM drizzle_migrations`);
}

/**
 * Verify schema integrity after migrations
 */
export async function verifySchema(db: TestDatabase): Promise<{
  tables: string[];
  indexes: Array<{ table: string; name: string }>;
  foreignKeys: Array<{ table: string; from: string; to: string }>;
}> {
  const isPostgresDb = isPostgres(db);

  if (isPostgresDb) {
    // PostgreSQL schema verification
    const tables = await db.execute<{ tablename: string }>(
      sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'drizzle_migrations'`
    );

    const tableNames = Array.isArray(tables) ? tables.map((t) => t.tablename) : [];

    // Get indexes
    const indexes: Array<{ table: string; name: string }> = [];
    for (const tableName of tableNames) {
      const tableIndexes = await db.execute<{ indexname: string }>(
        sql.raw(`SELECT indexname FROM pg_indexes WHERE tablename = '${tableName}'`)
      );
      if (Array.isArray(tableIndexes)) {
        for (const idx of tableIndexes) {
          indexes.push({ table: tableName, name: idx.indexname });
        }
      }
    }

    // Get foreign keys
    const foreignKeys: Array<{ table: string; from: string; to: string }> = [];
    for (const tableName of tableNames) {
      const fks = await db.execute<{
        constraint_name: string;
        table_name: string;
        column_name: string;
        foreign_table_name: string;
        foreign_column_name: string;
      }>(
        sql.raw(`
          SELECT
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = '${tableName}'
        `)
      );
      if (Array.isArray(fks)) {
        for (const fk of fks) {
          foreignKeys.push({
            table: fk.table_name,
            from: fk.column_name,
            to: `${fk.foreign_table_name}.${fk.foreign_column_name}`,
          });
        }
      }
    }

    return {
      tables: tableNames,
      indexes,
      foreignKeys,
    };
  } else {
    // SQLite schema verification (existing logic)
    const tables = await db.execute<{ name: string }>(
      sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'drizzle_migrations'`
    );

    const tableNames = Array.isArray(tables) ? tables.map((t) => t.name) : [];

    // Get indexes
    const indexes: Array<{ table: string; name: string }> = [];
    for (const tableName of tableNames) {
      const tableIndexes = await db.execute<{ name: string }>(
        sql.raw(`PRAGMA index_list(${tableName})`)
      );
      if (Array.isArray(tableIndexes)) {
        for (const idx of tableIndexes) {
          indexes.push({ table: tableName, name: idx.name });
        }
      }
    }

    // Get foreign keys
    const foreignKeys: Array<{ table: string; from: string; to: string }> = [];
    for (const tableName of tableNames) {
      const fks = await db.execute<{
        id: number;
        seq: number;
        table: string;
        from: string;
        to: string;
        on_update: string;
        on_delete: string;
        match: string;
      }>(sql.raw(`PRAGMA foreign_key_list(${tableName})`));
      if (Array.isArray(fks)) {
        for (const fk of fks) {
          foreignKeys.push({
            table: tableName,
            from: fk.from,
            to: fk.to,
          });
        }
      }
    }

    return {
      tables: tableNames,
      indexes,
      foreignKeys,
    };
  }
}
