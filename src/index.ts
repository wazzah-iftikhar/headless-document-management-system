import { Elysia } from "elysia";
import { setupRoutes } from "./presentation/routes";
import { config } from "./config/app";
import { initDatabase } from "./config/init-db";
import { handleOrpcRequest } from "./presentation/orpc/server";
import { logger } from "./utils/logger";
import { correlationMiddleware } from "./presentation/middleware/correlation";
import { requestLoggingMiddleware } from "./presentation/middleware/request-logging";

// Initialize database on startup
await initDatabase();

const app = new Elysia()
  // Add correlation ID and request logging middleware
  .use(correlationMiddleware)
  .use(requestLoggingMiddleware)
  .get("/health", () => ({
    status: "ok",
    runtime: "bun",
  }))
  // oRPC endpoint - handle all /rpc paths
  .all("/rpc/*", async ({ request }) => {
    return handleOrpcRequest(request);
  })
  .use(setupRoutes)
  .listen(config.port);

logger.info("Server started", {
  port: app.server?.port,
  runtime: "bun",
});
logger.info("oRPC endpoint available", {
  endpoint: `/rpc`,
  port: app.server?.port,
});