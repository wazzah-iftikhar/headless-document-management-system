import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sql } from "drizzle-orm";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

/**
 * Migration Runner
 * 
 * Utility for running migrations up and down in tests.
 * Supports both file-based migrations and in-memory databases.
 */

export interface MigrationFile {
  name: string;
  path: string;
  content: string;
}

/**
 * Load all migration files from the drizzle directory
 */
export async function loadMigrations(migrationsDir: string = "./drizzle"): Promise<MigrationFile[]> {
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
}

/**
 * Split SQL migration content into individual statements
 */
function splitStatements(content: string): string[] {
  // Split by statement breakpoint marker
  const statements = content
    .split("--> statement-breakpoint")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

  return statements;
}

/**
 * Run migrations up (apply all migrations)
 */
export async function migrateUp(
  db: ReturnType<typeof drizzle>,
  migrations: MigrationFile[]
): Promise<void> {
  // Enable foreign keys for SQLite (required for FK constraints)
  await db.run(sql`PRAGMA foreign_keys = ON`);

  // Create migrations table if it doesn't exist
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER
    )
  `);

  for (const migration of migrations) {
    // Check if migration already applied
    const applied = await db.all<{ hash: string }[]>(
      sql`SELECT hash FROM drizzle_migrations WHERE hash = ${migration.name}`
    );

    if (applied.length > 0) {
      continue; // Skip already applied migrations
    }

    // Split and execute statements
    const statements = splitStatements(migration.content);
    for (const statement of statements) {
      if (statement.trim()) {
        await db.run(sql.raw(statement));
      }
    }

    // Record migration
    await db.run(
      sql`INSERT INTO drizzle_migrations (hash, created_at) VALUES (${migration.name}, ${Date.now()})`
    );
  }
}

/**
 * Run migrations down (rollback all migrations)
 * 
 * Note: This is a simplified rollback - in production you'd want
 * proper down migrations. For testing, we drop all tables.
 */
export async function migrateDown(db: ReturnType<typeof drizzle>): Promise<void> {
  // Get all table names
  const tables = await db.all<{ name: string }[]>(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'drizzle_migrations'`
  );

  // Drop all tables (including foreign key constraints)
  await db.run(sql`PRAGMA foreign_keys = OFF`);
  for (const table of tables) {
    await db.run(sql.raw(`DROP TABLE IF EXISTS ${table.name}`));
  }
  await db.run(sql`PRAGMA foreign_keys = ON`);

  // Clear migrations table
  await db.run(sql`DELETE FROM drizzle_migrations`);
}

/**
 * Create an in-memory database for testing
 */
export function createTestDatabase(): {
  db: ReturnType<typeof drizzle>;
  close: () => void;
} {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema: {} });

  return {
    db,
    close: () => sqlite.close(),
  };
}

/**
 * Verify schema integrity after migrations
 */
export async function verifySchema(db: ReturnType<typeof drizzle>): Promise<{
  tables: string[];
  indexes: Array<{ table: string; name: string }>;
  foreignKeys: Array<{ table: string; from: string; to: string }>;
}> {
  // Get all tables
  const tables = await db.all<{ name: string }[]>(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != 'drizzle_migrations'`
  );

  // Get all indexes
  const indexes: Array<{ table: string; name: string }> = [];
  for (const table of tables) {
    const tableIndexes = await db.all<{ name: string }[]>(
      sql.raw(`PRAGMA index_list(${table.name})`)
    );
    for (const idx of tableIndexes) {
      indexes.push({ table: table.name, name: idx.name });
    }
  }

  // Get foreign keys
  const foreignKeys: Array<{ table: string; from: string; to: string }> = [];
  for (const table of tables) {
    const fks = await db.all<{
      id: number;
      seq: number;
      table: string;
      from: string;
      to: string;
      on_update: string;
      on_delete: string;
      match: string;
    }[]>(sql.raw(`PRAGMA foreign_key_list(${table.name})`));
    for (const fk of fks) {
      foreignKeys.push({
        table: table.name,
        from: fk.from,
        to: fk.to,
      });
    }
  }

  return {
    tables: tables.map((t) => t.name),
    indexes,
    foreignKeys,
  };
}
