/**
 * Pagination Types
 * 
 * Defines types for paginated query results.
 * Used by repository interfaces to support pagination.
 */

/**
 * Pagination input parameters
 */
export interface PaginationParams {
  /**
   * Page number (1-indexed)
   * @default 1
   */
  page?: number;
  /**
   * Number of items per page
   * @default 10
   * @max 100
   */
  limit?: number;
  /**
   * Sort field name
   */
  sortBy?: string;
  /**
   * Sort direction
   * @default "asc"
   */
  sortOrder?: "asc" | "desc";
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /**
   * Current page number (1-indexed)
   */
  page: number;
  /**
   * Number of items per page
   */
  limit: number;
  /**
   * Total number of items
   */
  total: number;
  /**
   * Total number of pages
   */
  totalPages: number;
  /**
   * Whether there is a next page
   */
  hasNext: boolean;
  /**
   * Whether there is a previous page
   */
  hasPrev: boolean;
}

/**
 * Paginated result
 * 
 * Generic type for paginated query results.
 * Contains the data array and pagination metadata.
 */
export interface Paginated<T> {
  /**
   * Array of items for the current page
   */
  data: T[];
  /**
   * Pagination metadata
   */
  meta: PaginationMeta;
}

/**
 * Default pagination parameters
 */
export const DEFAULT_PAGINATION: Required<PaginationParams> = {
  page: 1,
  limit: 10,
  sortBy: "createdAt",
  sortOrder: "desc",
};

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
