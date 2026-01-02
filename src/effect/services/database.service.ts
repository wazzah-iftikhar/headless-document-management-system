import { Context, Effect, Layer } from "effect";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "../../models";

/**
 * Database Service Tag
 * Represents the database dependency in Effect Context
 */
export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  BunSQLiteDatabase<typeof schema>
>() {}

/**
 * Database Service Implementation
 * Creates and provides the database connection
 */
export const DatabaseServiceLive = Layer.succeed(
  DatabaseService,
  drizzle(new Database("database.sqlite"), { schema })
);

