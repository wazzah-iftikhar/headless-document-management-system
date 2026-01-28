/**
 * Effect Schema to oRPC Schema Adapter
 * 
 * This module provides utilities to use Effect Schema DTOs directly
 * as oRPC input/output schemas for type safety.
 * 
 * Since oRPC uses Zod by default, we create a validation wrapper that:
 * 1. Uses Effect Schema for validation (runtime)
 * 2. Provides type inference from Effect Schema (compile-time)
 * 3. Integrates seamlessly with oRPC procedures
 */

import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";

/**
 * Effect Schema Validator
 * 
 * Wraps an Effect Schema to provide validation that can be used
 * with oRPC procedures while maintaining full type safety.
 */
export interface EffectSchemaValidator<T> {
  /**
   * The Effect Schema instance
   */
  schema: Schema.Schema<T>;
  
  /**
   * Validate and decode input using Effect Schema
   */
  validate(input: unknown): Promise<T>;
  
  /**
   * Type helper for TypeScript inference
   */
  _type?: T;
}

/**
 * Create an Effect Schema validator for oRPC
 * 
 * This function wraps an Effect Schema to make it usable
 * as an oRPC input/output schema with full type safety.
 */
export function createEffectSchemaValidator<T, I = unknown>(
  schema: Schema.Schema<T, I>
): EffectSchemaValidator<T> {
  return {
    schema,
    async validate(input: unknown): Promise<T> {
      return Effect.runPromise(
        pipe(
          Schema.decodeUnknown(schema)(input),
          Effect.mapError((error) => {
            // Format Effect Schema parse errors for better error messages
            const errorMessage = String(error);
            return new Error(`Validation error: ${errorMessage}`);
          })
        )
      );
    },
  };
}

/**
 * Type helper to extract the TypeScript type from an Effect Schema
 */
export type InferEffectSchema<T> = T extends EffectSchemaValidator<infer U> ? U : never;

/**
 * Type helper to extract the TypeScript type from an Effect Schema directly
 */
export type InferSchemaType<S extends Schema.Schema<any, any>> = Schema.Schema.Type<S>;
