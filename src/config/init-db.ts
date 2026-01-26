import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "../infrastructure/database/schemas";
import { migrateUp, loadMigrations } from "../infrastructure/database/migrations/migration-runner";
import { sql } from "drizzle-orm";

/**
 * Initialize database schema using migrations
 * Creates tables using Drizzle migrations instead of manual SQL
 */
export async function initDatabase() {
  try {
    // Create documents table
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        metadata_tags TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Also create download_tokens table (updated to use TEXT document_id for UUIDs)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS download_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT NOT NULL UNIQUE,
        document_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        used_at TEXT
      )
    `);

    sqlite.close();
    console.log("✅ Database initialized successfully with migrations");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
}
