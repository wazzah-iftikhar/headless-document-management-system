import { Elysia } from "elysia";
import { setupRoutes } from "./routes";
import { config } from "./config/app";

const app = new Elysia()
  .get("/health", () => ({
    status: "ok",
    runtime: "bun",
  }))
  .use(setupRoutes)
  .listen(config.port);

console.log(`🟢 Server running at http://localhost:${app.server?.port}`);
