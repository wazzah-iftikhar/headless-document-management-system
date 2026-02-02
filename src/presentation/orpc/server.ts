/**
 * oRPC Server Setup
 * 
 * Creates an oRPC server using the fetch adapter for Elysia compatibility
 */

import { RPCHandler } from "@orpc/server/fetch";
import { apiRouter } from "./router";
import { createLogger, startPerformanceTracking } from "../../infrastructure/services/logger.service";
import { randomUUID } from "crypto";

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
  // Extract correlation ID from headers or generate new one
  const correlationId =
    request.headers.get("x-correlation-id") || request.headers.get("X-Correlation-Id") || randomUUID();
  
  const logger = createLogger(correlationId, {
    requestId: correlationId,
    operation: "handleOrpcRequest",
  });

  const url = new URL(request.url);
  logger.info("oRPC request received", {
    path: url.pathname,
    method: request.method,
    correlationId,
  });

  const perfTracker = startPerformanceTracking(`oRPC ${url.pathname}`);
  
  try {
    // Pass the request directly to oRPC handler
    // oRPC will handle routing based on the path
    const result = await orpcHandler.handle(request);
    
    if (result.matched) {
      const durationMs = perfTracker.end(logger, {
        path: url.pathname,
        statusCode: result.response.status,
        correlationId,
      });
      
      logger.info("oRPC request completed", {
        path: url.pathname,
        statusCode: result.response.status,
        durationMs,
        correlationId,
      });
      
      // Add correlation ID to response headers
      const response = new Response(result.response.body, {
        status: result.response.status,
        statusText: result.response.statusText,
        headers: {
          ...Object.fromEntries(result.response.headers.entries()),
          "X-Correlation-Id": correlationId,
        },
      });
      
      return response;
    }
    
    // If not matched, return 404
    perfTracker.end(logger, {
      path: url.pathname,
      statusCode: 404,
      correlationId,
    });
    
    logger.warn("oRPC request not matched", {
      path: url.pathname,
      correlationId,
    });
    
    const notFoundResponse = new Response("Not Found", { 
      status: 404,
      headers: {
        "X-Correlation-Id": correlationId,
      },
    });
    
    return notFoundResponse;
  } catch (error) {
    const durationMs = perfTracker.end(logger, {
      path: url.pathname,
      statusCode: 500,
      correlationId,
      error: true,
    });
    
    logger.error("oRPC request failed", error instanceof Error ? error : new Error(String(error)), {
      path: url.pathname,
      durationMs,
      correlationId,
    });
    
    const errorResponse = new Response("Internal Server Error", {
      status: 500,
      headers: {
        "X-Correlation-Id": correlationId,
      },
    });
    
    return errorResponse;
  }
}
