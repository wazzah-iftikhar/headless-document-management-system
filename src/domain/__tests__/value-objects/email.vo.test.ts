import { test, expect } from "bun:test";
import { Effect } from "effect";
import { EmailVO } from "../../user/value-objects/email.vo";

const validEmail = "test@example.com";
const validEmailUppercase = "TEST@EXAMPLE.COM";
const invalidEmail = "not-an-email";
const invalidEmailNoDomain = "test@";
const invalidEmailNoAt = "testexample.com";
const longEmail = "a".repeat(250) + "@example.com"; // 256 chars - too long
test("EmailVO: should create from valid email", async () => {
  const result = await Effect.runPromise(
    EmailVO.fromString(validEmail)
  );

  expect(result).toBeInstanceOf(EmailVO);
  expect(result.toString()).toBe(validEmail);
});

test("EmailVO: should fail with invalid email format", async () => {
  const result = await Effect.runPromise(
    Effect.either(EmailVO.fromString(invalidEmail))
  );

  expect(result._tag).toBe("Left");
});

test("EmailVO: should fail with email missing domain", async () => {
  const result = await Effect.runPromise(
    Effect.either(EmailVO.fromString(invalidEmailNoDomain))
  );

  expect(result._tag).toBe("Left");
});

test("EmailVO: should fail with email missing @ symbol", async () => {
  const result = await Effect.runPromise(
    Effect.either(EmailVO.fromString(invalidEmailNoAt))
  );

  expect(result._tag).toBe("Left");
});

test("EmailVO: should fail with email exceeding 255 characters", async () => {
  const result = await Effect.runPromise(
    Effect.either(EmailVO.fromString(longEmail))
  );

  expect(result._tag).toBe("Left");
});

test("EmailVO: should be equal when emails are the same (case-insensitive)", async () => {
  const email1 = await Effect.runPromise(EmailVO.fromString(validEmail));
  const email2 = await Effect.runPromise(EmailVO.fromString(validEmailUppercase));

  expect(email1.equals(email2)).toBe(true);
});

test("EmailVO: should not be equal when emails are different", async () => {
  const email1 = await Effect.runPromise(EmailVO.fromString(validEmail));
  const email2 = await Effect.runPromise(
    EmailVO.fromString("other@example.com")
  );

  expect(email1.equals(email2)).toBe(false);
});

test("EmailVO: should encode to string", async () => {
  const email = await Effect.runPromise(EmailVO.fromString(validEmail));

  expect(email.encode()).toBe(validEmail);
  expect(typeof email.encode()).toBe("string");
});
