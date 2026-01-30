/**
 * Schema Adapter
 * 
 * Converts Effect Schema to oRPC-compatible schemas.
 * oRPC uses Standard Schema, which Effect Schema can be converted to.
 */

import { Schema } from "@effect/schema";
import type { StandardSchemaV1 } from "@standard-schema/spec";

/**
 * Convert Effect Schema to oRPC/Standard Schema
 * 
 * Note: Effect Schema is compatible with Standard Schema,
 * so we can use Effect Schema directly with oRPC in most cases.
 * This adapter provides utilities for edge cases.
 */
export function toOrpcSchema<T extends Schema.Schema<any, any>>(
  schema: T
): StandardSchemaV1 {
  // Effect Schema implements Standard Schema, so we can use it directly
  return schema as unknown as StandardSchemaV1;
}

/**
 * Helper to create oRPC input/output schemas from Effect Schema
 */
export function createOrpcSchema<T extends Schema.Schema<any, any>>(schema: T) {
  return schema;
}
