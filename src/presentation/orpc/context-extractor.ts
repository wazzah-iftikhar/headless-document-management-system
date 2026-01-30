/**
 * Context Extractor for oRPC
 * 
 * Extracts user and workspace context from request headers.
 * Currently simplified - in production, this would extract JWT tokens.
 */

export interface RequestContext {
  userId?: string;
  workspaceId?: string;
  email?: string;
  role?: string;
}

/**
 * Extract context from request headers
 * 
 * In production, this would:
 * 1. Extract JWT token from Authorization header
 * 2. Verify and decode the token
 * 3. Extract user/workspace information
 * 
 * For now, returns empty context (no auth required)
 */
export function extractContext(headers: Headers): RequestContext {
  const authHeader = headers.get("authorization");
  
  if (!authHeader) {
    return {}; // No auth for now
  }

  // TODO: Implement JWT token extraction and verification
  // const token = authHeader.replace("Bearer ", "");
  // const decoded = verifyJWT(token);
  // return {
  //   userId: decoded.userId,
  //   workspaceId: decoded.workspaceId,
  //   email: decoded.email,
  //   role: decoded.role,
  // };

  return {};
}
