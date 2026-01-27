/**
 * Example Repository Test
 * 
 * Demonstrates how to use repository test utilities.
 * This is an example file - actual repository tests should be in infrastructure/repositories/__tests__
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestDatabase, teardownTestDatabase, type TestDatabaseSetup } from "../database";
import { DocumentRepositoryImpl } from "../../infrastructure/repositories/implementations/document.repository.impl";
import {
  RepositoryTestContext,
  documentBuilder,
  assertDocumentMatches,
  assertDocumentCreated,
  resetBuilders,
} from "./repository-test-helpers";
import { resetUuidSeed } from "../fixtures";

describe("Repository Test Example", () => {
  let testDb: TestDatabaseSetup;
  let repoContext: RepositoryTestContext;
  let documentRepo: DocumentRepositoryImpl;

  beforeAll(async () => {
    testDb = await setupTestDatabase({
      runMigrations: true,
      seedData: false,
    });
    repoContext = new RepositoryTestContext(testDb);
    documentRepo = new DocumentRepositoryImpl();
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
  });

  beforeEach(async () => {
    await testDb.clear();
    resetUuidSeed();
    resetBuilders();
  });

  it("should create a document using repository", async () => {
    // Build test data
    const createData = documentBuilder()
      .withFilename("test.pdf")
      .withOriginalFilename("original.pdf")
      .withFilePath("/documents/test.pdf")
      .withFileSize(1000)
      .withMetadataTags(["test", "example"])
      .buildCreateData();

    // Execute repository operation
    const result = await repoContext.execute(
      documentRepo.create(createData)
    );

    // Assert result
    assertDocumentCreated(result, {
      filename: "test.pdf",
      originalFilename: "original.pdf",
      filePath: "/documents/test.pdf",
      fileSize: 1000,
      metadataTags: ["test", "example"],
    });
  });

  it("should find document by ID", async () => {
    // Create document first
    const createData = documentBuilder()
      .withIndex(0)
      .buildCreateData();

    const created = await repoContext.execute(
      documentRepo.create(createData)
    );

    // Find by ID
    const found = await repoContext.execute(
      documentRepo.findById(created.id)
    );

    // Assert
    assertDocumentMatches(found, {
      id: created.id,
      filename: created.filename,
    });
  });

  it("should handle document not found error", async () => {
    const error = await repoContext.executeExpectError(
      documentRepo.findById("non-existent-id")
    );

    expect(error).toMatchObject({
      _tag: "DocumentNotFound",
      documentId: "non-existent-id",
    });
  });
});
