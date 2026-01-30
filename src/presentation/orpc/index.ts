/**
 * oRPC Presentation Layer
 * 
 * Exports oRPC router and related utilities
 */

export { apiRouter, type ApiRouter } from "./router";
export { documentRouter } from "./document.procedures";
export { extractContext, type RequestContext } from "./context-extractor";
export { toOrpcSchema, createOrpcSchema } from "./schema-adapter";
