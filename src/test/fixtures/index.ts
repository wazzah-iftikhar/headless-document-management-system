/**
 * Test Fixtures and Factories
 * 
 * Main entry point for all test fixtures and factories.
 * 
 * This module provides deterministic, realistic test data generation for:
 * - Domain entities (Document, User, AccessPolicy, DocumentVersion)
 * - DTOs (commands, queries, results)
 * - Persistence models
 * 
 * All factories use seed-based generation to ensure deterministic, repeatable test data.
 * 
 * @example
 * ```typescript
 * import { 
 *   createDocumentDomain, 
 *   createCreateDocumentCommand,
 *   createDocumentPersistence,
 *   resetUuidSeed 
 * } from "./test/fixtures";
 * 
 * // Reset seed for test isolation
 * resetUuidSeed();
 * 
 * // Create domain entity
 * const document = createDocumentDomain({ index: 0 });
 * 
 * // Create command DTO
 * const command = createCreateDocumentCommand({ index: 0 });
 * 
 * // Create persistence model
 * const persistence = createDocumentPersistence({ index: 0 });
 * ```
 */

// Export utilities
export * from "./utils";

// Export domain factories
export * from "./factories/domain";

// Export DTO factories
export * from "./factories/dto";

// Export persistence factories
export * from "./factories/persistence";
