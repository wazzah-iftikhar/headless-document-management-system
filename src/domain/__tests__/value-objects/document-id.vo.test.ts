import { test, expect } from "bun:test";
import { Effect } from "effect";
import { DocumentIdVO } from "../../document/value-objects/document-id.vo";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const invalidUUID = "not-a-uuid";

test("DocumentIdVO: should create from valid UUID v4", async () => {
  const result = await Effect.runPromise(
    DocumentIdVO.fromString(validUUID)
  );

  expect(result).toBeInstanceOf(DocumentIdVO);
  expect(result.toString()).toBe(validUUID);
});

test("DocumentIdVO: should fail with invalid UUID format", async () => {
  const result = await Effect.runPromise(
    Effect.either(DocumentIdVO.fromString(invalidUUID))
  );

  expect(result._tag).toBe("Left");
});

test("DocumentIdVO: should be equal when values are the same", async () => {
  const id1 = await Effect.runPromise(DocumentIdVO.fromString(validUUID));
  const id2 = await Effect.runPromise(DocumentIdVO.fromString(validUUID));

  expect(id1.equals(id2)).toBe(true);
});

test("DocumentIdVO: should encode to string", async () => {
  const id = await Effect.runPromise(DocumentIdVO.fromString(validUUID));

  expect(id.encode()).toBe(validUUID);
});
