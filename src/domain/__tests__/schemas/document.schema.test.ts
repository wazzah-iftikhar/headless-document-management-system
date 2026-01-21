import { test, expect } from "bun:test";
import { Effect, Schema } from "effect";
import { DocumentSchema } from "../../document/document.entity.schema";
import { DocumentFactory } from "../factories/document.factory";
test("Document Schema: should validate valid document domain object", async () => {
  // Create raw input data (as it would come from API/persistence)
  const rawDocument = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    fileReference: {
      filename: "test-document.pdf",
      originalFilename: "test-document.pdf",
      filePath: "/uploads/test-document.pdf",
    },
    fileSize: 1024,
    metadataTags: ["test", "document"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(DocumentSchema)(rawDocument))
  );

  expect(result._tag).toBe("Right");
});

test("Document Schema: should fail with invalid document ID format", async () => {
  const invalidDocument = {
    id: "not-a-uuid",
    fileReference: {
      filename: "test-document.pdf",
      originalFilename: "test-document.pdf",
      filePath: "/uploads/test-document.pdf",
    },
    fileSize: 1024,
    metadataTags: ["test"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(DocumentSchema)(invalidDocument))
  );

  expect(result._tag).toBe("Left");
});

test("Document Schema: should fail with file size <= 0", async () => {
  const invalidDocument = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    fileReference: {
      filename: "test-document.pdf",
      originalFilename: "test-document.pdf",
      filePath: "/uploads/test-document.pdf",
    },
    fileSize: 0,
    metadataTags: ["test"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(DocumentSchema)(invalidDocument))
  );

  expect(result._tag).toBe("Left");
});

test("Document Schema: should fail with negative file size", async () => {
  const invalidDocument = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    fileReference: {
      filename: "test-document.pdf",
      originalFilename: "test-document.pdf",
      filePath: "/uploads/test-document.pdf",
    },
    fileSize: -1,
    metadataTags: ["test"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(DocumentSchema)(invalidDocument))
  );

  expect(result._tag).toBe("Left");
});

test("Document Schema: should validate document with optional checksum", async () => {
  const rawDocument = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    fileReference: {
      filename: "test-document.pdf",
      originalFilename: "test-document.pdf",
      filePath: "/uploads/test-document.pdf",
    },
    fileSize: 1024,
    checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    metadataTags: ["test"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(DocumentSchema)(rawDocument))
  );

  expect(result._tag).toBe("Right");
});

test("Document Schema: should validate document without checksum", async () => {
  const rawDocument = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    fileReference: {
      filename: "test-document.pdf",
      originalFilename: "test-document.pdf",
      filePath: "/uploads/test-document.pdf",
    },
    fileSize: 1024,
    metadataTags: ["test"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(DocumentSchema)(rawDocument))
  );

  expect(result._tag).toBe("Right");
});

test("Document Schema: should encode and decode document domain object", async () => {
  // Raw input (as from persistence layer)
  const rawDocument = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    fileReference: {
      filename: "test-document.pdf",
      originalFilename: "test-document.pdf",
      filePath: "/uploads/test-document.pdf",
    },
    fileSize: 1024,
    checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    metadataTags: ["test", "document"],
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  // Decode (raw -> domain)
  const decodeResult = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(DocumentSchema)(rawDocument))
  );

  expect(decodeResult._tag).toBe("Right");
  
  if (decodeResult._tag === "Right") {
    const domainDocument = decodeResult.right;
    
    // Verify domain document has Date objects
    expect(domainDocument.createdAt).toBeInstanceOf(Date);
    expect(domainDocument.updatedAt).toBeInstanceOf(Date);
  }
});
