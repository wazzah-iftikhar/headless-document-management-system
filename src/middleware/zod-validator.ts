import { z } from "zod";
import { errorResponse } from "../utils/response";

/**
 * Validate params using Zod schema
 */
export const validateParams = <T extends z.ZodTypeAny>(
  schema: T,
  params: unknown
): 
  | { error: { status: number; body: unknown }; data?: never }
  | { error?: never; data: z.infer<T> } => {
  const result = schema.safeParse(params);
  if (!result.success) {
    return {
      error: {
        status: 400,
        body: errorResponse("Validation error", result.error.issues),
      },
    } as { error: { status: number; body: unknown }; data?: never };
  }
  return { data: result.data } as { error?: never; data: z.infer<T> };
};

/**
 * Validate query using Zod schema
 */
export const validateQuery = <T extends z.ZodTypeAny>(
  schema: T,
  query: unknown
): 
  | { error: { status: number; body: unknown }; data?: never }
  | { error?: never; data: z.infer<T> } => {
  const result = schema.safeParse(query);
  if (!result.success) {
    return {
      error: {
        status: 400,
        body: errorResponse("Validation error", result.error.issues),
      },
    } as { error: { status: number; body: unknown }; data?: never };
  }
  return { data: result.data } as { error?: never; data: z.infer<T> };
};

/**
 * Validate body using Zod schema
 */
export const validateBody = <T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): 
  | { error: { status: number; body: unknown }; data?: never }
  | { error?: never; data: z.infer<T> } => {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      error: {
        status: 400,
        body: errorResponse("Validation error", result.error.issues),
      },
    } as { error: { status: number; body: unknown }; data?: never };
  }
  return { data: result.data } as { error?: never; data: z.infer<T> };
};

/**
 * Response validation helper
 * Validates response data against a Zod schema
 */
export const validateResponse = <T extends z.ZodTypeAny>(
  data: unknown,
  schema: T
): z.infer<T> => {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn("Response validation failed:", result.error);
    // In production, you might want to throw or log this
    return data as z.infer<T>;
  }
  return result.data;
};
