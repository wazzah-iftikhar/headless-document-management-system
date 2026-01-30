/**
 * oRPC Server Setup
 * 
 * Creates an oRPC server using the fetch adapter for Elysia compatibility
 */

import { RPCHandler } from "@orpc/server/fetch";
import { apiRouter } from "./router";

/**
 * Create oRPC fetch handler
 * This can be used with any fetch-compatible server (Elysia, Hono, etc.)
 * RPCHandler accepts a Router directly
 */
export const orpcHandler = new RPCHandler(apiRouter);

/**
 * Handle oRPC requests
 * Extracts request and returns response
 * 
 * oRPC routing works by matching the request path to the router structure.
 * The path should match the router namespace and procedure name.
 */
export async function handleOrpcRequest(request: Request): Promise<Response> {
  // Pass the request directly to oRPC handler
  // oRPC will handle routing based on the path
  const result = await orpcHandler.handle(request);
  
  if (result.matched) {
    return result.response;
  }
  
  // If not matched, return 404
  return new Response("Not Found", { status: 404 });
}
