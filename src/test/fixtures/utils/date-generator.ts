/**
 * Date Generator for Test Fixtures
 * 
 * Provides deterministic date generation for consistent test data.
 */

/**
 * Generate a deterministic date based on an index
 * 
 * @param index - Index to use for date generation (defaults to 0)
 * @param baseDate - Base date to start from (defaults to 2024-01-01)
 * @returns A Date object
 */
export function generateTestDate(
  index: number = 0,
  baseDate: Date = new Date("2024-01-01T00:00:00.000Z")
): Date {
  return new Date(baseDate.getTime() + index * 24 * 60 * 60 * 1000); // Add days
}

/**
 * Generate a date string in ISO format
 */
export function generateTestDateString(
  index: number = 0,
  baseDate: Date = new Date("2024-01-01T00:00:00.000Z")
): string {
  return generateTestDate(index, baseDate).toISOString();
}

/**
 * Generate a date in the past
 */
export function generatePastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Generate a date in the future
 */
export function generateFutureDate(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}
