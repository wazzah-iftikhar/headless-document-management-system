import { test, expect } from "bun:test";
import { Effect, Option } from "effect";
import { MetadataTagsVO } from "../../document/value-objects/metadata-tags.vo";

const validTags = ["tag1", "tag2", "tag3"];
const singleTag = ["tag1"];
const emptyTags: string[] = [];
test("MetadataTagsVO: should create from valid tags array", async () => {
  const result = await Effect.runPromise(
    MetadataTagsVO.fromArray(validTags)
  );

  expect(result).toBeInstanceOf(MetadataTagsVO);
  expect(result.getCount()).toBe(3);
});

test("MetadataTagsVO: should create from single tag", async () => {
  const result = await Effect.runPromise(
    MetadataTagsVO.fromArray(singleTag)
  );

  expect(result).toBeInstanceOf(MetadataTagsVO);
  expect(result.getCount()).toBe(1);
});

test("MetadataTagsVO: should create empty MetadataTagsVO", () => {
  const result = MetadataTagsVO.empty();
  expect(result.isEmpty()).toBe(true);
  expect(result.getCount()).toBe(0);
});

test("MetadataTagsVO: should fail with tag exceeding 50 characters", async () => {
  const longTag = "a".repeat(51);
  const result = await Effect.runPromise(
    Effect.either(MetadataTagsVO.fromArray([longTag]))
  );

  expect(result._tag).toBe("Left");
});

test("MetadataTagsVO: should fail with empty tag string", async () => {
  const result = await Effect.runPromise(
    Effect.either(MetadataTagsVO.fromArray([""]))
  );

  expect(result._tag).toBe("Left");
});

test("MetadataTagsVO: should return Some when tags exist", async () => {
  const tags = await Effect.runPromise(MetadataTagsVO.fromArray(validTags));
  const result = tags.getTags();

  expect(Option.isSome(result)).toBe(true);
  if (Option.isSome(result)) {
    expect(result.value).toEqual(validTags);
  }
});

test("MetadataTagsVO: should return None when tags are empty", () => {
  const tags = MetadataTagsVO.empty();
  const result = tags.getTags();

  expect(Option.isNone(result)).toBe(true);
});

test("MetadataTagsVO: should check if tag exists (case-insensitive)", async () => {
  const tags = await Effect.runPromise(MetadataTagsVO.fromArray(validTags));

  expect(tags.hasTag("tag1")).toBe(true);
  expect(tags.hasTag("TAG1")).toBe(true);
  expect(tags.hasTag("nonexistent")).toBe(false);
});

test("MetadataTagsVO: should check if tags are empty", async () => {
  const empty = MetadataTagsVO.empty();
  const withTags = await Effect.runPromise(MetadataTagsVO.fromArray(validTags));

  expect(empty.isEmpty()).toBe(true);
  expect(withTags.isEmpty()).toBe(false);
});

test("MetadataTagsVO: should get tag count", async () => {
  const tags = await Effect.runPromise(MetadataTagsVO.fromArray(validTags));

  expect(tags.getCount()).toBe(3);
});

test("MetadataTagsVO: should be equal when tag arrays are the same (sorted)", async () => {
  const tags1 = await Effect.runPromise(
    MetadataTagsVO.fromArray(["tag1", "tag2", "tag3"])
  );
  const tags2 = await Effect.runPromise(
    MetadataTagsVO.fromArray(["tag3", "tag1", "tag2"])
  );

  expect(tags1.equals(tags2)).toBe(true);
});

test("MetadataTagsVO: should not be equal when tag arrays differ", async () => {
  const tags1 = await Effect.runPromise(
    MetadataTagsVO.fromArray(["tag1", "tag2"])
  );
  const tags2 = await Effect.runPromise(
    MetadataTagsVO.fromArray(["tag1", "tag3"])
  );

  expect(tags1.equals(tags2)).toBe(false);
});

test("MetadataTagsVO: should encode to array", async () => {
  const tags = await Effect.runPromise(MetadataTagsVO.fromArray(validTags));

  const encoded = tags.encode();
  expect(encoded).toEqual(validTags);
  expect(Array.isArray(encoded)).toBe(true);
});
