import jwt from "@elysiajs/jwt";
import { config } from "../../config/app";

/**
 * JWT Payload Structure
 * Contains user and workspace context extracted from JWT token
 */
export interface JWTPayload {
  userId: string;
  workspaceId: string; // Primary workspace ID
  email?: string;
  role?: string;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * JWT Service
 * Handles JWT token signing and verification
 */
export class JWTService {
  private static jwtInstance = jwt({
    name: "jwt",
    secret: config.jwtSecret,
  });

  /**
   * Sign a JWT token with user and workspace context
   */
  static async sign(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
    const jwtInstance = await this.jwtInstance;
    const token = await jwtInstance.sign({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    });
    
    if (!token) {
      throw new Error("Failed to sign JWT token");
    }
    
    return token;
  }

  /**
   * Verify and decode a JWT token
   * Returns the payload if valid, throws error if invalid
   */
  static async verify(token: string): Promise<JWTPayload> {
    const jwtInstance = await this.jwtInstance;
    const payload = await jwtInstance.verify(token);
    
    if (!payload) {
      throw new Error("Invalid or expired JWT token");
    }
    
    // Validate required fields
    if (!payload.userId || !payload.workspaceId) {
      throw new Error("JWT token missing required fields (userId, workspaceId)");
    }
    
    return payload as JWTPayload;
  }

  /**
   * Extract token from Authorization header
   * Supports "Bearer <token>" format
   */
  static extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) {
      return null;
    }
    
    if (authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
    
    return null;
  }
}
