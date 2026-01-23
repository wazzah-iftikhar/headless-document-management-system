import { test, expect } from "bun:test";
import { Effect } from "effect";
import { UserIdVO } from "../../user/value-objects/user-id.vo";

const validUUID = "550e8400-e29b-41d4-a716-446655440000";
const invalidUUID = "not-a-uuid";
const invalidUUIDFormat = "550e8400-e29b-41d4-a716-44665544000"; // Too short

// UserIdVO Validation Tests
test("UserIdVO: should create from valid UUID v4", async () => {
  const result = await Effect.runPromise(
    UserIdVO.fromString(validUUID)
  );

  expect(result).toBeInstanceOf(UserIdVO);
  expect(result.toString()).toBe(validUUID);
});

test("UserIdVO: should fail with invalid UUID format", async () => {
  const result = await Effect.runPromise(
    Effect.either(UserIdVO.fromString(invalidUUID))
  );

  expect(result._tag).toBe("Left");
});

test("UserIdVO: should fail with malformed UUID", async () => {
  const result = await Effect.runPromise(
    Effect.either(UserIdVO.fromString(invalidUUIDFormat))
  );

  expect(result._tag).toBe("Left");
});

test("UserIdVO: should fail with empty string", async () => {
  const result = await Effect.runPromise(
    Effect.either(UserIdVO.fromString(""))
  );

  expect(result._tag).toBe("Left");
});

test("UserIdVO: should be equal when values are the same", async () => {
  const id1 = await Effect.runPromise(UserIdVO.fromString(validUUID));
  const id2 = await Effect.runPromise(UserIdVO.fromString(validUUID));

  expect(id1.equals(id2)).toBe(true);
});

test("UserIdVO: should not be equal when values are different", async () => {
  const id1 = await Effect.runPromise(UserIdVO.fromString(validUUID));
  const id2 = await Effect.runPromise(
    UserIdVO.fromString("650e8400-e29b-41d4-a716-446655440000")
  );

  expect(id1.equals(id2)).toBe(false);
});

test("UserIdVO: should encode to string", async () => {
  const id = await Effect.runPromise(UserIdVO.fromString(validUUID));

  expect(id.encode()).toBe(validUUID);
  expect(typeof id.encode()).toBe("string");
});

test("UserIdVO: should convert to string", async () => {
  const id = await Effect.runPromise(UserIdVO.fromString(validUUID));

  expect(id.toString()).toBe(validUUID);
});
