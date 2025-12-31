import { randomBytes } from "crypto";

/**
 * Generate a secure random token for download links
 */
export function generateDownloadToken(): string {
  return randomBytes(32).toString("hex");
}



