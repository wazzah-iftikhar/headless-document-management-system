import { JWTService, type JWTPayload } from "../../infrastructure/services/jwt.service";

/**
 * Request Context for oRPC
 * Extracted from JWT token in request headers
 */
export interface RequestContext {
  userId: string;
  workspaceId: string;
  email?: string;
  role?: string;
}

/**
 * Extract context from request headers
 * 
 * Extracts and verifies JWT token from Authorization header.
 * Returns user and workspace context for use in oRPC procedures.
 * 
 * @param headers - Request headers containing Authorization header
 * @returns RequestContext with user and workspace information
 * @throws Error if token is invalid or missing required fields
 */
export function extractContext(headers: Headers): RequestContext {
  const authHeader = headers.get("authorization") || headers.get("Authorization");
  
  if (!authHeader) {
    throw new Error("Missing Authorization header. Expected: Bearer <token>");
  }

  const token = JWTService.extractTokenFromHeader(authHeader);
  
  if (!token) {
    throw new Error("Invalid Authorization header format. Expected: Bearer <token>");
  }

  // Verify token synchronously (in real async context, this would be awaited)
  // For oRPC, we'll handle this in the procedure handler
  // This function signature is kept for compatibility but will be called from async context
  throw new Error("extractContext must be called with await in async context. Use extractContextAsync instead.");
}

/**
 * Extract context from request headers (async version)
 * 
 * Extracts and verifies JWT token from Authorization header.
 * Returns user and workspace context for use in oRPC procedures.
 * 
 * @param headers - Request headers containing Authorization header
 * @returns Promise<RequestContext> with user and workspace information
 * @throws Error if token is invalid or missing required fields
 */
export async function extractContextAsync(headers: Headers): Promise<RequestContext> {
  const authHeader = headers.get("authorization") || headers.get("Authorization");
  
  if (!authHeader) {
    throw new Error("Missing Authorization header. Expected: Bearer <token>");
  }

  const token = JWTService.extractTokenFromHeader(authHeader);
  
  if (!token) {
    throw new Error("Invalid Authorization header format. Expected: Bearer <token>");
  }

  try {
    const payload = await JWTService.verify(token);
    
    return {
      userId: payload.userId,
      workspaceId: payload.workspaceId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error: any) {
    throw new Error(`JWT verification failed: ${error.message}`);
  }
}
