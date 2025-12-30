// Main routes aggregator
import { Elysia } from "elysia";
import { documentRoutes } from "./document.routes";

export const setupRoutes = (app: Elysia) => {
  return app.use(documentRoutes);
};

