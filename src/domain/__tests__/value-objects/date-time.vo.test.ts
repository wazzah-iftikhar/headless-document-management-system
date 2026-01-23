import { test, expect } from "bun:test";
import { Effect } from "effect";
import { DateTimeVO } from "../../document/value-objects/date-time.vo";

const validISOString = "2024-01-01T00:00:00.000Z";
const invalidISOString = "not-a-date";
const invalidFormat = "2024-01-01"; // Missing time
test("DateTimeVO: should create from valid ISO string", async () => {
  const result = await Effect.runPromise(
    DateTimeVO.fromISOString(validISOString)
  );

  expect(result).toBeInstanceOf(DateTimeVO);
});

test("DateTimeVO: should create from Date object", () => {
  const date = new Date(validISOString);
  const result = DateTimeVO.fromDate(date);

  expect(result).toBeInstanceOf(DateTimeVO);
});

test("DateTimeVO: should create for current time", () => {
  const result = DateTimeVO.now();
  expect(result).toBeInstanceOf(DateTimeVO);
});

test("DateTimeVO: should fail with invalid ISO string", async () => {
  const result = await Effect.runPromise(
    Effect.either(DateTimeVO.fromISOString(invalidISOString))
  );

  expect(result._tag).toBe("Left");
});

test("DateTimeVO: should fail with date missing time component", async () => {
  const result = await Effect.runPromise(
    Effect.either(DateTimeVO.fromISOString(invalidFormat))
  );

  expect(result._tag).toBe("Left");
});

test("DateTimeVO: should be equal when timestamps are the same", async () => {
  const dt1 = await Effect.runPromise(DateTimeVO.fromISOString(validISOString));
  const dt2 = await Effect.runPromise(DateTimeVO.fromISOString(validISOString));

  expect(dt1.equals(dt2)).toBe(true);
});

test("DateTimeVO: should not be equal when timestamps differ", async () => {
  const dt1 = await Effect.runPromise(DateTimeVO.fromISOString(validISOString));
  const dt2 = await Effect.runPromise(
    DateTimeVO.fromISOString("2024-01-02T00:00:00.000Z")
  );

  expect(dt1.equals(dt2)).toBe(false);
});

test("DateTimeVO: should encode to ISO string", async () => {
  const dt = await Effect.runPromise(DateTimeVO.fromISOString(validISOString));

  const encoded = dt.encode();
  expect(encoded).toBe(validISOString);
  expect(typeof encoded).toBe("string");
});

test("DateTimeVO: should convert to Date object", async () => {
  const dt = await Effect.runPromise(DateTimeVO.fromISOString(validISOString));

  const date = dt.toDate();
  expect(date).toBeInstanceOf(Date);
  expect(date.toISOString()).toBe(validISOString);
});
