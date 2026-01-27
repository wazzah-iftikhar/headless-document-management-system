/**
 * Integration Tests for Complete Workflows
 * 
 * Tests the complete document lifecycle:
 * 1. Create document (metadata only)
 * 2. Initiate upload (get upload token)
 * 3. Confirm upload (persist file and version)
 * 4. Publish document (change status)
 * 
 * Uses test database with Testcontainers for isolation.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestDatabase, teardownTestDatabase, type TestDatabaseSetup } from "../database";
import {
  CreateDocumentUseCase,
  InitiateUploadUseCase,
  ConfirmUploadUseCase,
  PublishDocumentUseCase,
  GetDocumentUseCase,
} from "../../application/use-cases";
import {
  createCreateDocumentCommand,
  createInitiateUploadCommand,
  createConfirmUploadCommand,
  createPublishDocumentCommand,
  resetUuidSeed,
} from "../fixtures";
import { executeUseCaseWithTestDb, executeUseCaseExpectError } from "./use-case-helpers";

describe("Document Workflow Integration Tests", () => {
  let testDb: TestDatabaseSetup;

  beforeAll(async () => {
    // Setup test database with migrations
    testDb = await setupTestDatabase({
      runMigrations: true,
      seedData: false, // We'll create our own test data
    });
  });

  afterAll(async () => {
    // Teardown test database
    await teardownTestDatabase(testDb);
  });

  beforeEach(async () => {
    // Clear database between tests for isolation
    await testDb.clear();
    resetUuidSeed();
  });

  describe("Complete Workflow: Create → Upload → Publish", () => {
    it("should complete the full document lifecycle workflow", async () => {
      // Step 1: Create document (metadata only)
      const createCommand = createCreateDocumentCommand({
        filename: "test-document.pdf",
        originalFilename: "original-test-document.pdf",
        metadataTags: ["test", "workflow"],
        index: 0,
      });

      const createUseCase = new CreateDocumentUseCase();
      const createResult = await executeUseCaseWithTestDb(
        createUseCase.execute(createCommand),
        testDb
      );

      expect(createResult).toBeDefined();
      expect(createResult.id).toBeDefined();
      expect(createResult.filename).toBe(createCommand.filename);
      expect(createResult.originalFilename).toBe(createCommand.originalFilename);
      expect(createResult.fileSize).toBe(0); // No file yet
      expect(createResult.checksum).toBeUndefined();
      expect(createResult.metadataTags).toContain("test");
      expect(createResult.metadataTags).toContain("workflow");

      const documentId = createResult.id;

      // Step 2: Initiate upload
      const initiateCommand = createInitiateUploadCommand({
        documentId,
        filename: "test-document.pdf",
        fileSize: 1024 * 100, // 100 KB
        contentType: "application/pdf",
        index: 0,
      });

      const initiateUseCase = new InitiateUploadUseCase();
      const initiateResult = await executeUseCaseWithTestDb(
        initiateUseCase.execute(initiateCommand),
        testDb
      );

      expect(initiateResult).toBeDefined();
      expect(initiateResult.uploadToken).toBeDefined();
      expect(initiateResult.documentId).toBe(documentId);
      expect(initiateResult.uploadUrl).toBeDefined();
      expect(initiateResult.expiresAt).toBeDefined();

      const uploadToken = initiateResult.uploadToken;

      // Step 3: Confirm upload
      const confirmCommand = createConfirmUploadCommand({
        documentId,
        uploadToken,
        checksum: "a".repeat(64), // Valid SHA-256 checksum
        filePath: `/documents/${documentId}/test-document.pdf`,
        fileSize: 1024 * 100,
        index: 0,
      });

      const confirmUseCase = new ConfirmUploadUseCase();
      const confirmResult = await executeUseCaseWithTestDb(
        confirmUseCase.execute(confirmCommand),
        testDb
      );

      expect(confirmResult).toBeDefined();
      expect(confirmResult.documentId).toBe(documentId);
      expect(confirmResult.versionNumber).toBe(1); // First version
      expect(confirmResult.checksum).toBe(confirmCommand.checksum);
      expect(confirmResult.filePath).toBe(confirmCommand.filePath);

      // Step 4: Verify document was updated with file info
      const getUseCase = new GetDocumentUseCase();
      const documentAfterUpload = await executeUseCaseWithTestDb(
        getUseCase.execute({ documentId }),
        testDb
      );

      expect(documentAfterUpload.fileSize).toBe(1024 * 100);
      expect(documentAfterUpload.checksum).toBe(confirmCommand.checksum);
      expect(documentAfterUpload.filePath).toBe(confirmCommand.filePath);

      // Step 5: Publish document
      const publishCommand = createPublishDocumentCommand({
        documentId,
        status: "published",
        index: 0,
      });

      const publishUseCase = new PublishDocumentUseCase();
      const publishResult = await executeUseCaseWithTestDb(
        publishUseCase.execute(publishCommand),
        testDb
      );

      expect(publishResult).toBeDefined();
      expect(publishResult.id).toBe(documentId);
      expect(publishResult.metadataTags).toContain("status:published");

      // Step 6: Verify final document state
      const finalDocument = await executeUseCaseWithTestDb(
        getUseCase.execute({ documentId }),
        testDb
      );

      expect(finalDocument.metadataTags).toContain("status:published");
      expect(finalDocument.fileSize).toBe(1024 * 100);
      expect(finalDocument.checksum).toBe(confirmCommand.checksum);
    });

    it("should handle multiple uploads and versioning", async () => {
      // Create document
      const createCommand = createCreateDocumentCommand({ index: 0 });
      const createUseCase = new CreateDocumentUseCase();
      const createResult = await executeUseCaseWithTestDb(
        createUseCase.execute(createCommand),
        testDb
      );

      const documentId = createResult.id;

      // First upload
      const initiate1 = createInitiateUploadCommand({
        documentId,
        fileSize: 1000,
        index: 0,
      });
      const initiateUseCase = new InitiateUploadUseCase();
      const upload1 = await executeUseCaseWithTestDb(
        initiateUseCase.execute(initiate1),
        testDb
      );

      const confirm1 = createConfirmUploadCommand({
        documentId,
        uploadToken: upload1.uploadToken,
        checksum: "a".repeat(64),
        fileSize: 1000,
        index: 0,
      });
      const confirmUseCase = new ConfirmUploadUseCase();
      const version1 = await executeUseCaseWithTestDb(
        confirmUseCase.execute(confirm1),
        testDb
      );

      expect(version1.versionNumber).toBe(1);

      // Second upload (new version)
      const initiate2 = createInitiateUploadCommand({
        documentId,
        fileSize: 2000,
        index: 1,
      });
      const upload2 = await executeUseCaseWithTestDb(
        initiateUseCase.execute(initiate2),
        testDb
      );

      const confirm2 = createConfirmUploadCommand({
        documentId,
        uploadToken: upload2.uploadToken,
        checksum: "b".repeat(64), // Different checksum
        fileSize: 2000,
        index: 1,
      });
      const version2 = await executeUseCaseWithTestDb(
        confirmUseCase.execute(confirm2),
        testDb
      );

      expect(version2.versionNumber).toBe(2);

      // Verify document has latest file info
      const getUseCase = new GetDocumentUseCase();
      const document = await executeUseCaseWithTestDb(
        getUseCase.execute({ documentId }),
        testDb
      );

      expect(document.fileSize).toBe(2000);
      expect(document.checksum).toBe("b".repeat(64));
    });

    it("should handle idempotent upload confirmation", async () => {
      // Create document
      const createCommand = createCreateDocumentCommand({ index: 0 });
      const createUseCase = new CreateDocumentUseCase();
      const createResult = await executeUseCaseWithTestDb(
        createUseCase.execute(createCommand),
        testDb
      );

      const documentId = createResult.id;
      const checksum = "a".repeat(64);

      // First upload
      const initiate1 = createInitiateUploadCommand({
        documentId,
        fileSize: 1000,
        index: 0,
      });
      const initiateUseCase = new InitiateUploadUseCase();
      const upload1 = await executeUseCaseWithTestDb(
        initiateUseCase.execute(initiate1),
        testDb
      );

      const confirm1 = createConfirmUploadCommand({
        documentId,
        uploadToken: upload1.uploadToken,
        checksum,
        fileSize: 1000,
        index: 0,
      });
      const confirmUseCase = new ConfirmUploadUseCase();
      const version1 = await executeUseCaseWithTestDb(
        confirmUseCase.execute(confirm1),
        testDb
      );

      expect(version1.versionNumber).toBe(1);

      // Second upload with same checksum (should be idempotent)
      const initiate2 = createInitiateUploadCommand({
        documentId,
        fileSize: 1000,
        index: 1,
      });
      const upload2 = await executeUseCaseWithTestDb(
        initiateUseCase.execute(initiate2),
        testDb
      );

      const confirm2 = createConfirmUploadCommand({
        documentId,
        uploadToken: upload2.uploadToken,
        checksum, // Same checksum
        fileSize: 1000,
        index: 1,
      });

      // Should return existing version (idempotent)
      const version2 = await executeUseCaseWithTestDb(
        confirmUseCase.execute(confirm2),
        testDb
      );

      // Should return the same version number (idempotent)
      expect(version2.versionNumber).toBe(1);
      expect(version2.checksum).toBe(checksum);
    });

    it("should handle status transitions correctly", async () => {
      // Create and upload document
      const createCommand = createCreateDocumentCommand({ index: 0 });
      const createUseCase = new CreateDocumentUseCase();
      const createResult = await executeUseCaseWithTestDb(
        createUseCase.execute(createCommand),
        testDb
      );

      const documentId = createResult.id;

      // Upload file
      const initiateCommand = createInitiateUploadCommand({
        documentId,
        fileSize: 1000,
        index: 0,
      });
      const initiateUseCase = new InitiateUploadUseCase();
      const upload = await executeUseCaseWithTestDb(
        initiateUseCase.execute(initiateCommand),
        testDb
      );

      const confirmCommand = createConfirmUploadCommand({
        documentId,
        uploadToken: upload.uploadToken,
        checksum: "a".repeat(64),
        fileSize: 1000,
        index: 0,
      });
      const confirmUseCase = new ConfirmUploadUseCase();
      await executeUseCaseWithTestDb(
        confirmUseCase.execute(confirmCommand),
        testDb
      );

      // Publish document (draft -> published)
      const publishCommand = createPublishDocumentCommand({
        documentId,
        status: "published",
        index: 0,
      });
      const publishUseCase = new PublishDocumentUseCase();
      const published = await executeUseCaseWithTestDb(
        publishUseCase.execute(publishCommand),
        testDb
      );

      expect(published.metadataTags).toContain("status:published");

      // Archive document (published -> archived)
      const archiveCommand = createPublishDocumentCommand({
        documentId,
        status: "archived",
        index: 0,
      });
      const archived = await executeUseCaseWithTestDb(
        publishUseCase.execute(archiveCommand),
        testDb
      );

      expect(archived.metadataTags).toContain("status:archived");
    });

    it("should reject invalid status transitions", async () => {
      // Create and publish document
      const createCommand = createCreateDocumentCommand({ index: 0 });
      const createUseCase = new CreateDocumentUseCase();
      const createResult = await executeUseCaseWithTestDb(
        createUseCase.execute(createCommand),
        testDb
      );

      const documentId = createResult.id;

      // Publish document
      const publishCommand = createPublishDocumentCommand({
        documentId,
        status: "published",
        index: 0,
      });
      const publishUseCase = new PublishDocumentUseCase();
      await executeUseCaseWithTestDb(
        publishUseCase.execute(publishCommand),
        testDb
      );

      // Try to go back to draft (should fail)
      const draftCommand = createPublishDocumentCommand({
        documentId,
        status: "draft",
        index: 0,
      });

      const error = await executeUseCaseExpectError(
        publishUseCase.execute(draftCommand),
        testDb
      );

      expect(error).toMatchObject({
        _tag: "InvalidStatusTransition",
      });
    });
  });
});
