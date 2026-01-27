/**
 * UUID Generator for Test Fixtures
 * 
 * Provides deterministic UUID generation for consistent test data.
 * Uses a seed-based approach to generate predictable UUIDs.
 */

let seed = 0;

/**
 * Reset the UUID seed (useful for test isolation)
 */
export function resetUuidSeed(): void {
  seed = 0;
}

/**
 * Generate a deterministic UUID v4 for testing
 * 
 * @param index - Optional index to use for generation (defaults to incrementing seed)
 * @returns A deterministic UUID string
 */
export function generateTestUuid(index?: number): string {
  const idx = index !== undefined ? index : seed++;
  
  // Generate a deterministic UUID v4 format
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const hex = idx.toString(16).padStart(32, "0");
  
  // Ensure version 4 (4xxx)
  const version = "4";
  
  // Ensure variant (yxxx) - 8, 9, a, or b
  const variant = ["8", "9", "a", "b"][idx % 4];
  
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    version + hex.substring(13, 16),
    variant + hex.substring(17, 20),
    hex.substring(20, 32),
  ].join("-");
}

/**
 * Generate multiple UUIDs at once
 */
export function generateTestUuids(count: number): string[] {
  return Array.from({ length: count }, (_, i) => generateTestUuid(i));
}
