import { Elysia } from "elysia";
import { setupRoutes } from "./presentation/routes";
import { config } from "./config/app";
import { initDatabase } from "./config/init-db";
import { handleOrpcRequest } from "./presentation/orpc/server";

// Initialize database on startup
await initDatabase();

const app = new Elysia()
  .get("/health", () => ({
    status: "ok",
    runtime: "bun",
  }))
  // oRPC endpoint - handle all /rpc paths
  .all("/rpc", async ({ request }) => {
    return handleOrpcRequest(request);
  })
  .all("/rpc/*", async ({ request }) => {
    return handleOrpcRequest(request);
  })
  .use(setupRoutes)
  .listen(config.port);

console.log(`🟢 Server running at http://localhost:${app.server?.port}`);
console.log(`📡 oRPC endpoint available at http://localhost:${app.server?.port}/rpc`);