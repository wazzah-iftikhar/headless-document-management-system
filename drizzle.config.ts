import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit Configuration
 * 
 * Configures drizzle-kit for generating and managing database migrations.
 * Uses SQLite with Bun adapter.
 */
export default {
  schema: "./src/infrastructure/database/schemas/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./database.sqlite",
  },
} satisfies Config;
