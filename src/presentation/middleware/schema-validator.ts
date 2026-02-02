import { Schema } from "@effect/schema";
import { Effect, Either } from "effect";
import { errorResponse } from "../utils/response";
import { logger } from "../../infrastructure/services/logger.service";

/**
 * Validate params using Effect Schema
 */
export const validateParams = <A, I>(
  schema: Schema.Schema<A, I>,
  params: unknown
):
  | { error: { status: number; body: unknown }; data?: never }
  | { error?: never; data: A } => {
  const result = Effect.runSync(Effect.either(Schema.decodeUnknown(schema)(params)));
  
  if (Either.isLeft(result)) {
    const parseError = result.left;
    // Format ParseError - check the actual structure
    const issues = (parseError as any).errors 
      ? (parseError as any).errors.map((e: any) => ({
          path: e.path?.map((p: any) => p.key || p).join(".") || "",
          message: e.message || "Validation error",
        }))
      : [{ path: "", message: String(parseError) }];
    
    return {
      error: {
        status: 400,
        body: errorResponse("Validation error", issues),
      },
    } as { error: { status: number; body: unknown }; data?: never };
  }
  return { data: result.right } as { error?: never; data: A };
};

/**
 * Validate query using Effect Schema
 */
export const validateQuery = <A, I>(
  schema: Schema.Schema<A, I>,
  query: unknown
):
  | { error: { status: number; body: unknown }; data?: never }
  | { error?: never; data: A } => {
  const result = Effect.runSync(Effect.either(Schema.decodeUnknown(schema)(query)));
  
  if (Either.isLeft(result)) {
    const parseError = result.left;
    const issues = (parseError as any).errors 
      ? (parseError as any).errors.map((e: any) => ({
          path: e.path?.map((p: any) => p.key || p).join(".") || "",
          message: e.message || "Validation error",
        }))
      : [{ path: "", message: String(parseError) }];
    
    return {
      error: {
        status: 400,
        body: errorResponse("Validation error", issues),
      },
    } as { error: { status: number; body: unknown }; data?: never };
  }
  return { data: result.right } as { error?: never; data: A };
};

/**
 * Validate body using Effect Schema
 */
export const validateBody = <A, I>(
  schema: Schema.Schema<A, I>,
  body: unknown
):
  | { error: { status: number; body: unknown }; data?: never }
  | { error?: never; data: A } => {
  const result = Effect.runSync(Effect.either(Schema.decodeUnknown(schema)(body)));
  
  if (Either.isLeft(result)) {
    const parseError = result.left;
    const issues = (parseError as any).errors 
      ? (parseError as any).errors.map((e: any) => ({
          path: e.path?.map((p: any) => p.key || p).join(".") || "",
          message: e.message || "Validation error",
        }))
      : [{ path: "", message: String(parseError) }];
    
    return {
      error: {
        status: 400,
        body: errorResponse("Validation error", issues),
      },
    } as { error: { status: number; body: unknown }; data?: never };
  }
  return { data: result.right } as { error?: never; data: A };
};

/**
 * Response validation helper
 * Validates response data against an Effect Schema
 */
export const validateResponse = <A, I>(
  data: unknown,
  schema: Schema.Schema<A, I>
): A => {
  const result = Effect.runSync(Effect.either(Schema.decodeUnknown(schema)(data)));
  if (Either.isLeft(result)) {
    logger.warn("Response validation failed", {
      error: String(result.left),
      operation: "validateResponse",
    });
    return data as A;
  }
  return result.right;
};
