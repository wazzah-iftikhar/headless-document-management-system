/**
 * Checksum Generator for Test Fixtures
 * 
 * Provides deterministic SHA-256 checksum generation for consistent test data.
 */

/**
 * Generate a deterministic SHA-256 checksum (64 hex characters)
 * 
 * @param index - Index to use for checksum generation
 * @returns A SHA-256 checksum string (64 hex characters)
 */
export function generateTestChecksum(index: number = 0): string {
  // Generate a deterministic checksum by padding the index
  const hex = index.toString(16).padStart(64, "0");
  return hex.substring(0, 64); // Ensure exactly 64 characters
}

/**
 * Generate a checksum from content (for realistic testing)
 * Note: This is a simplified version. In real tests, you might want to use actual crypto.
 */
export function generateChecksumFromContent(content: string): string {
  // For testing purposes, create a deterministic hash-like string
  // In real scenarios, you'd use crypto.createHash('sha256').update(content).digest('hex')
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(64, "0").substring(0, 64);
}
