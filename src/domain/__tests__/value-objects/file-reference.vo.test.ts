import { test, expect } from "bun:test";
import { Effect } from "effect";
import { FileReferenceVO } from "../../document/value-objects/file-reference.vo";

const validFilename = "test-document.pdf";
const validOriginalFilename = "original-document.pdf";
const validFilePath = "/uploads/test-document.pdf";
test("FileReferenceVO: should create from valid components", async () => {
  const result = await Effect.runPromise(
    FileReferenceVO.create(validFilename, validOriginalFilename, validFilePath)
  );

  expect(result).toBeInstanceOf(FileReferenceVO);
  expect(result.getFilename()).toBe(validFilename);
  expect(result.getOriginalFilename()).toBe(validOriginalFilename);
  expect(result.getFilePath()).toBe(validFilePath);
});

test("FileReferenceVO: should fail with empty filename", async () => {
  const result = await Effect.runPromise(
    Effect.either(FileReferenceVO.create("", validOriginalFilename, validFilePath))
  );

  expect(result._tag).toBe("Left");
});

test("FileReferenceVO: should fail with filename exceeding 255 characters", async () => {
  const longFilename = "a".repeat(256) + ".pdf";
  const result = await Effect.runPromise(
    Effect.either(FileReferenceVO.create(longFilename, validOriginalFilename, validFilePath))
  );

  expect(result._tag).toBe("Left");
});

test("FileReferenceVO: should fail with empty file path", async () => {
  const result = await Effect.runPromise(
    Effect.either(FileReferenceVO.create(validFilename, validOriginalFilename, ""))
  );

  expect(result._tag).toBe("Left");
});

test("FileReferenceVO: should be equal when all fields are the same", async () => {
  const ref1 = await Effect.runPromise(
    FileReferenceVO.create(validFilename, validOriginalFilename, validFilePath)
  );
  const ref2 = await Effect.runPromise(
    FileReferenceVO.create(validFilename, validOriginalFilename, validFilePath)
  );

  expect(ref1.equals(ref2)).toBe(true);
});

test("FileReferenceVO: should not be equal when fields differ", async () => {
  const ref1 = await Effect.runPromise(
    FileReferenceVO.create(validFilename, validOriginalFilename, validFilePath)
  );
  const ref2 = await Effect.runPromise(
    FileReferenceVO.create("other.pdf", validOriginalFilename, validFilePath)
  );

  expect(ref1.equals(ref2)).toBe(false);
});

test("FileReferenceVO: should encode to object", async () => {
  const ref = await Effect.runPromise(
    FileReferenceVO.create(validFilename, validOriginalFilename, validFilePath)
  );

  const encoded = ref.encode();
  expect(encoded).toEqual({
    filename: validFilename,
    originalFilename: validOriginalFilename,
    filePath: validFilePath,
  });
});
