import { Elysia } from "elysia";
import { getLogger, getCorrelationId } from "./correlation";
import { startPerformanceTracking } from "../../infrastructure/services/logger.service";

/**
 * Request Logging Middleware
 * 
 * Logs incoming requests with:
 * - Correlation ID
 * - HTTP method and path
 * - User context (if available)
 * - Request duration
 * - Response status
 * 
 * Usage:
 * ```ts
 * app.use(requestLoggingMiddleware)
 * ```
 */
export const requestLoggingMiddleware = new Elysia({ name: "requestLogging" })
  .onRequest(({ request, store, path, method }) => {
    const logger = getLogger(store);
    const correlationId = getCorrelationId(store);
    
    // Start performance tracking
    const perfTracker = startPerformanceTracking(`${method} ${path}`);
    store.requestPerfTracker = perfTracker;

    // Extract user context if available
    const userContext = store?.userContext;
    
    logger.info("Incoming request", {
      method,
      path,
      correlationId,
      userId: userContext?.userId,
      workspaceId: userContext?.workspaceId,
      userAgent: request.headers.get("user-agent"),
    });
  })
  .onAfterHandle(({ request, store, path, method, set }) => {
    const logger = getLogger(store);
    const correlationId = getCorrelationId(store);
    const perfTracker = store.requestPerfTracker;
    
    // End performance tracking
    if (perfTracker) {
      const durationMs = perfTracker.end(logger, {
        method,
        path,
        statusCode: set.status || 200,
        correlationId,
      });
      
      // Log request completion
      const userContext = store?.userContext;
      logger.info("Request completed", {
        method,
        path,
        statusCode: set.status || 200,
        durationMs,
        correlationId,
        userId: userContext?.userId,
        workspaceId: userContext?.workspaceId,
      });
    }
  })
  .onError(({ error, store, path, method, set }) => {
    const logger = getLogger(store);
    const correlationId = getCorrelationId(store);
    const perfTracker = store.requestPerfTracker;
    
    // End performance tracking
    if (perfTracker) {
      perfTracker.end(logger, {
        method,
        path,
        statusCode: set.status || 500,
        correlationId,
        error: true,
      });
    }
    
    // Log error
    const userContext = store?.userContext;
    logger.error("Request failed", error as Error, {
      method,
      path,
      statusCode: set.status || 500,
      correlationId,
      userId: userContext?.userId,
      workspaceId: userContext?.workspaceId,
    });
  });
