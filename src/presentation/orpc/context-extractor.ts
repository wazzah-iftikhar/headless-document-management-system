/**
 * Context Extraction from Headers
 * 
 * Extracts workspace and user context from JWT tokens in request headers.
 * This provides the context needed for use cases to operate within the
 * correct workspace and user scope.
 */

import { config } from "../../config/app";

/**
 * Request Context
 * Contains user and workspace information extracted from JWT headers
 */
export interface RequestContext {
  userId: string;
  workspaceId: string;
  email?: string;
  role?: string;
}

/**
 * JWT Payload Structure
 * Expected structure of JWT token payload
 */
export interface JWTPayload {
  userId: string;
  workspaceId: string;
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract Authorization header from request headers
 */
function getAuthHeader(headers: Headers | Record<string, string> | undefined): string | null {
  if (!headers) return null;
  
  // Handle Headers object (from Fetch API)
  if (headers instanceof Headers) {
    return headers.get("authorization") || headers.get("Authorization");
  }
  
  // Handle plain object
  const authHeader = headers["authorization"] || headers["Authorization"] || headers["x-authorization"] || headers["X-Authorization"];
  return authHeader || null;
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  // Support both "Bearer <token>" and just "<token>"
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  
  return authHeader;
}

/**
 * Decode JWT token (without verification)
 * For production, use a proper JWT library with verification
 */
function decodeJWT(token: string): JWTPayload | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode payload (base64url)
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(decoded) as JWTPayload;
    
    // Check expiration if present
    if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    
    return parsed;
  } catch (error) {
    return null;
  }
}

/**
 * Verify JWT token signature
 * In production, use a proper JWT library like jose or jsonwebtoken
 * For now, we'll do basic validation
 */
function verifyJWT(token: string, secret: string): boolean {
  // Basic validation - in production, use proper JWT verification
  // This is a placeholder that checks token structure
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return false;
    }
    
    // Decode and check expiration
    const payload = decodeJWT(token);
    if (!payload) {
      return false;
    }
    
    // In production, verify HMAC signature here
    // For now, we'll trust the token if it decodes correctly
    // TODO: Implement proper JWT signature verification
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract context from request headers
 * 
 * Looks for JWT token in Authorization header and extracts:
 * - userId
 * - workspaceId
 * - email (optional)
 * - role (optional)
 * 
 * @param headers - Request headers (Headers object or plain object)
 * @returns RequestContext if valid token found, null otherwise
 */
export function extractContextFromHeaders(
  headers: Headers | Record<string, string> | undefined
): RequestContext | null {
  try {
    // Get Authorization header
    const authHeader = getAuthHeader(headers);
    if (!authHeader) {
      return null;
    }
    
    // Extract Bearer token
    const token = extractBearerToken(authHeader);
    if (!token) {
      return null;
    }
    
    // Verify token (basic check)
    const isValid = verifyJWT(token, config.jwtSecret);
    if (!isValid) {
      return null;
    }
    
    // Decode token payload
    const payload = decodeJWT(token);
    if (!payload) {
      return null;
    }
    
    // Validate required fields
    if (!payload.userId || !payload.workspaceId) {
      return null;
    }
    
    // Return context
    return {
      userId: payload.userId,
      workspaceId: payload.workspaceId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    // Log error in production
    console.warn("Failed to extract context from headers:", error);
    return null;
  }
}

/**
 * Extract context from Hono request
 * Convenience function for Hono integration
 */
export function extractContextFromHonoRequest(
  request: Request | { headers: Headers | Record<string, string> }
): RequestContext | null {
  const headers = request instanceof Request 
    ? request.headers 
    : request.headers;
  return extractContextFromHeaders(headers);
}

/**
 * Create a default context for testing/development
 * Returns a context with default values when no token is present
 */
export function createDefaultContext(): RequestContext {
  return {
    userId: "default-user-id",
    workspaceId: "default-workspace-id",
  };
}
