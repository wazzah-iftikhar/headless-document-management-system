import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { downloadTokens } from "../models"; // Only download tokens still use old model

/**
 * Legacy database connection for download tokens
 * Note: Download tokens still use old model structure.
 * TODO: Migrate download tokens to new infrastructure when refactored.
 */
const sqlite = new Database("database.sqlite");
export const db = drizzle(sqlite, { schema: { downloadTokens } });
