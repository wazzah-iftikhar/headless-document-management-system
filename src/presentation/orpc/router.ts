/**
 * oRPC Router
 * 
 * Main router that combines all procedure routers.
 */

import { os } from "@orpc/server";
import { documentRouter } from "./document.procedures";

/**
 * Main API Router
 * Combines all procedure routers
 */
export const apiRouter = os.router({
  document: documentRouter,
});

export type ApiRouter = typeof apiRouter;
