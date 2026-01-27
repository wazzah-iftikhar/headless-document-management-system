import { Elysia } from "elysia";
import { setupRoutes } from "./presentation/routes";
import { config } from "./config/app";
import { initDatabase } from "./config/init-db";

// Initialize database on startup
await initDatabase();

const app = new Elysia()
  .get("/health", () => ({
    status: "ok",
    runtime: "bun",
  }))
  .use(setupRoutes)
  .listen(config.port);

console.log(`🟢 Server running at http://localhost:${app.server?.port}`);
