/**
 * Example Use Case Integration Test
 * 
 * Demonstrates how to use use case integration test utilities.
 * This is an example file - actual use case tests should be in test/integration/
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestDatabase, teardownTestDatabase, type TestDatabaseSetup } from "../database";
import { CreateDocumentUseCase } from "../../application/use-cases";
import {
  UseCaseIntegrationTestContext,
  setupUseCaseIntegrationTest,
} from "./use-case-integration-helpers";
import { createCreateDocumentCommand, resetUuidSeed } from "../fixtures";

describe("Use Case Integration Test Example", () => {
  let testDb: TestDatabaseSetup;
  let useCaseContext: UseCaseIntegrationTestContext;

  beforeAll(async () => {
    testDb = await setupTestDatabase({
      runMigrations: true,
      seedData: false,
    });
    useCaseContext = setupUseCaseIntegrationTest(testDb);
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
  });

  beforeEach(async () => {
    await testDb.clear();
    resetUuidSeed();
  });

  it("should execute use case with real repositories", async () => {
    const command = createCreateDocumentCommand({
      filename: "test.pdf",
      originalFilename: "original.pdf",
      metadataTags: ["test"],
      index: 0,
    });

    const useCase = new CreateDocumentUseCase();
    const result = await useCaseContext.execute(
      useCase.execute(command)
    );

    expect(result).toBeDefined();
    expect(result.filename).toBe("test.pdf");
    expect(result.originalFilename).toBe("original.pdf");
    expect(result.metadataTags).toContain("test");
  });

  it("should handle use case errors", async () => {
    const command = createCreateDocumentCommand({
      filename: "", // Invalid - should fail validation
      originalFilename: "original.pdf",
      index: 0,
    });

    const useCase = new CreateDocumentUseCase();
    const error = await useCaseContext.executeExpectError(
      useCase.execute(command)
    );

    expect(error).toMatchObject({
      _tag: "ValidationError",
    });
  });
});
