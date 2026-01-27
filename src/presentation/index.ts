/**
 * Presentation Layer
 * 
 * Main entry point for presentation layer exports.
 * 
 * This layer handles HTTP concerns:
 * - Routes (HTTP endpoint definitions)
 * - Controllers (Request/Response handling)
 * - Middleware (Validation, Auth, etc.)
 * - Validations (Request/Response schemas)
 * - Error handling (HTTP errors)
 */

export * from "./routes";
export * from "./controllers";
export * from "./middleware";
export * from "./validations";
export * from "./errors/controller.errors";
export * from "./utils/response";
export * from "./utils/http.utils";
