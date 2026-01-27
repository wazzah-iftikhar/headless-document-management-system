/**
 * Test Fixtures and Factories
 * 
 * Main entry point for all test fixtures and factories.
 * 
 * Usage:
 * ```typescript
 * import { createDocumentDomain, createCreateDocumentCommand } from "./test/fixtures";
 * 
 * const document = createDocumentDomain({ index: 0 });
 * const command = createCreateDocumentCommand({ index: 0 });
 * ```
 */

// Export utilities
export * from "./utils";

// Export domain factories
export * from "./domain";

// Export DTO factories
export * from "./dto";

// Export persistence factories
export * from "./persistence";
