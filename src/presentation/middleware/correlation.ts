import { Elysia } from "elysia";
import { randomUUID } from "crypto";
import { createLogger, type Logger } from "../../utils/logger";

/**
 * Correlation ID Middleware
 * 
 * Generates and tracks correlation IDs for request tracing.
 * 
 * Features:
 * - Generates unique correlation ID for each request
 * - Extracts correlation ID from X-Correlation-Id header if present
 * - Attaches logger with correlation ID to request store
 * - Adds correlation ID to response headers
 * 
 * Usage:
 * ```ts
 * app.use(correlationMiddleware)
 * ```
 */
export const correlationMiddleware = new Elysia({ name: "correlation" })
  .derive(({ headers, set }) => {
    // Extract correlation ID from header or generate new one
    const correlationId =
      headers["x-correlation-id"] || headers["X-Correlation-Id"] || randomUUID();

    // Create logger with correlation ID
    const logger = createLogger(correlationId, {
      requestId: correlationId,
    });

    // Add correlation ID to response headers
    set.headers["X-Correlation-Id"] = correlationId;

    return {
      correlationId,
      logger,
    };
  });

/**
 * Get logger from request store
 * Helper function for use in handlers
 */
export function getLogger(store: any): Logger {
  if (store?.logger && typeof store.logger === "object") {
    return store.logger as Logger;
  }
  // Fallback to global logger if not found
  const { logger } = require("../../utils/logger");
  return logger;
}

/**
 * Get correlation ID from request store
 */
export function getCorrelationId(store: any): string | undefined {
  return store?.correlationId;
}
