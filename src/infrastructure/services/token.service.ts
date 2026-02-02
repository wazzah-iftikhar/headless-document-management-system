import { randomBytes } from "crypto";

/**
 * Token Service
 * 
 * Generates secure random tokens for download links and other security purposes.
 */
export class TokenService {
  /**
   * Generate a secure random token for download links
   */
  static generateDownloadToken(): string {
    return randomBytes(32).toString("hex");
  }
}

/**
 * Convenience export for backward compatibility
 */
export function generateDownloadToken(): string {
  return TokenService.generateDownloadToken();
}
