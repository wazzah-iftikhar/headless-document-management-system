import { test, expect } from "bun:test";
import { Effect, Schema } from "effect";
import { UserSchema } from "../../user/user.entity.schema";
import { UserFactory } from "../factories/user.factory";
test("User Schema: should validate valid user domain object", async () => {
  // Create raw input data (as it would come from API/persistence)
  const rawUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    role: "admin",
    workspaceIds: ["650e8400-e29b-41d4-a716-446655440000"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(UserSchema)(rawUser))
  );

  expect(result._tag).toBe("Right");
});

test("User Schema: should fail with invalid user ID format", async () => {
  const invalidUser = {
    id: "not-a-uuid",
    email: "test@example.com",
    role: "admin",
    workspaceIds: ["650e8400-e29b-41d4-a716-446655440000"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(UserSchema)(invalidUser))
  );

  expect(result._tag).toBe("Left");
});

test("User Schema: should fail with invalid email format", async () => {
  const invalidUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "not-an-email",
    role: "admin",
    workspaceIds: ["650e8400-e29b-41d4-a716-446655440000"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(UserSchema)(invalidUser))
  );

  expect(result._tag).toBe("Left");
});

test("User Schema: should fail with invalid role", async () => {
  const invalidUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    role: "invalid-role",
    workspaceIds: ["650e8400-e29b-41d4-a716-446655440000"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(UserSchema)(invalidUser))
  );

  expect(result._tag).toBe("Left");
});

test("User Schema: should allow empty workspaceIds array", async () => {
  const userWithEmptyWorkspaces = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    role: "admin",
    workspaceIds: [],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(UserSchema)(userWithEmptyWorkspaces))
  );

  // Schema allows empty arrays
  expect(result._tag).toBe("Right");
});

test("User Schema: should encode and decode user domain object", async () => {
  // Raw input (as from persistence layer)
  const rawUser = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    email: "test@example.com",
    role: "admin",
    workspaceIds: ["650e8400-e29b-41d4-a716-446655440000"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  // Decode (raw -> domain)
  const decodeResult = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(UserSchema)(rawUser))
  );

  expect(decodeResult._tag).toBe("Right");
  
  if (decodeResult._tag === "Right") {
    const domainUser = decodeResult.right;
    
    // Verify domain user has Date objects
    expect(domainUser.createdAt).toBeInstanceOf(Date);
    expect(domainUser.updatedAt).toBeInstanceOf(Date);
  }
});
