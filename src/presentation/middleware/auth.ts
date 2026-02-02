import { Elysia } from "elysia";
import { JWTService, type JWTPayload } from "../../infrastructure/services/jwt.service";

/**
 * User Context
 * Extracted from JWT token and attached to request context
 */
export interface UserContext {
  userId: string;
  workspaceId: string;
  email?: string;
  role?: string;
}

/**
 * Authentication Middleware
 * 
 * Validates JWT tokens and extracts user/workspace context.
 * 
 * Behavior:
 * - Extracts JWT from Authorization header (Bearer token)
 * - Verifies token signature and expiration
 * - Extracts user and workspace context
 * - Attaches context to request store for use in handlers
 * - Returns 401 if token is missing or invalid
 * 
 * Usage:
 * ```ts
 * app.use(authMiddleware)
 * ```
 * 
 * Or for specific routes:
 * ```ts
 * app.use(authMiddleware).get("/protected", ({ store }) => {
 *   const { userId, workspaceId } = store.userContext;
 *   // ...
 * })
 * ```
 */
export const authMiddleware = new Elysia({ name: "auth" })
  .derive(async ({ headers, set }) => {
    // Extract Authorization header
    const authHeader = headers.authorization || headers.Authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    // If no token, return 401
    if (!token) {
      set.status = 401;
      return {
        error: "Unauthorized",
        message: "Missing or invalid Authorization header. Expected: Bearer <token>",
      };
    }

    try {
      // Verify and decode JWT
      const payload = await JWTService.verify(token);

      // Extract user context
      const userContext: UserContext = {
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        email: payload.email,
        role: payload.role,
      };

      // Attach to request store
      return {
        userContext,
      };
    } catch (error: any) {
      // Token verification failed
      set.status = 401;
      return {
        error: "Unauthorized",
        message: error.message || "Invalid or expired JWT token",
      };
    }
  })
  .onBeforeHandle(({ store, set }) => {
    // Check if authentication failed (error was set)
    if ("error" in store && store.error === "Unauthorized") {
      set.status = 401;
      return {
        success: false,
        error: store.error,
        message: store.message,
      };
    }
  });

/**
 * Optional Authentication Middleware
 * 
 * Similar to authMiddleware but doesn't fail if token is missing.
 * Useful for endpoints that work with or without authentication.
 * 
 * Usage:
 * ```ts
 * app.use(optionalAuthMiddleware).get("/public", ({ store }) => {
 *   if (store.userContext) {
 *     // User is authenticated
 *   } else {
 *     // User is not authenticated
 *   }
 * })
 * ```
 */
export const optionalAuthMiddleware = new Elysia({ name: "optionalAuth" })
  .derive(async ({ headers }) => {
    const authHeader = headers.authorization || headers.Authorization;
    const token = JWTService.extractTokenFromHeader(authHeader);

    if (!token) {
      return {
        userContext: undefined as UserContext | undefined,
      };
    }

    try {
      const payload = await JWTService.verify(token);
      const userContext: UserContext = {
        userId: payload.userId,
        workspaceId: payload.workspaceId,
        email: payload.email,
        role: payload.role,
      };
      return {
        userContext,
      };
    } catch {
      // Token invalid, but don't fail - just return undefined
      return {
        userContext: undefined as UserContext | undefined,
      };
    }
  });

/**
 * Extract user context from request
 * Helper function for use in handlers
 */
export function getUserContext(store: any): UserContext | null {
  if (store?.userContext && typeof store.userContext === "object") {
    return store.userContext as UserContext;
  }
  return null;
}