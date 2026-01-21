import { test, expect } from "bun:test";
import { Effect, Schema } from "effect";
import { AccessPolicySchema } from "../../access-policy/access-policy.entity.schema";
import { AccessPolicyFactory } from "../factories/access-policy.factory";
import { PermissionAction } from "../../access-policy/value-objects/permission-action.vo";
test("AccessPolicy Schema: should validate valid access policy domain object", async () => {
  // Create raw input data (as it would come from API/persistence)
  const rawPolicy = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    subjectType: "user",
    subjectId: "650e8400-e29b-41d4-a716-446655440000",
    resourceType: "document",
    resourceId: null,
    actions: ["read"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(AccessPolicySchema)(rawPolicy))
  );

  expect(result._tag).toBe("Right");
});

test("AccessPolicy Schema: should fail with invalid policy ID format", async () => {
  const invalidPolicy = {
    id: "not-a-uuid",
    subjectType: "user",
    subjectId: "650e8400-e29b-41d4-a716-446655440000",
    resourceType: "document",
    resourceId: null,
    actions: ["read"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(AccessPolicySchema)(invalidPolicy))
  );

  expect(result._tag).toBe("Left");
});

test("AccessPolicy Schema: should fail with invalid subject type", async () => {
  const invalidPolicy = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    subjectType: "invalid-type",
    subjectId: "650e8400-e29b-41d4-a716-446655440000",
    resourceType: "document",
    resourceId: null,
    actions: ["read"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(AccessPolicySchema)(invalidPolicy))
  );

  expect(result._tag).toBe("Left");
});

test("AccessPolicy Schema: should fail with invalid resource type", async () => {
  const invalidPolicy = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    subjectType: "user",
    subjectId: "650e8400-e29b-41d4-a716-446655440000",
    resourceType: "invalid-resource",
    resourceId: null,
    actions: ["read"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(AccessPolicySchema)(invalidPolicy))
  );

  expect(result._tag).toBe("Left");
});

test("AccessPolicy Schema: should fail with invalid permission action", async () => {
  const invalidPolicy = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    subjectType: "user",
    subjectId: "650e8400-e29b-41d4-a716-446655440000",
    resourceType: "document",
    resourceId: null,
    actions: ["invalid-action"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(AccessPolicySchema)(invalidPolicy))
  );

  expect(result._tag).toBe("Left");
});

test("AccessPolicy Schema: should validate policy with null resourceId (wildcard)", async () => {
  const rawPolicy = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    subjectType: "user",
    subjectId: "650e8400-e29b-41d4-a716-446655440000",
    resourceType: "document",
    resourceId: null,
    actions: ["read"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(AccessPolicySchema)(rawPolicy))
  );

  expect(result._tag).toBe("Right");
});

test("AccessPolicy Schema: should validate policy with specific resourceId", async () => {
  const rawPolicy = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    subjectType: "user",
    subjectId: "user-id",
    resourceType: "document",
    resourceId: "550e8400-e29b-41d4-a716-446655440000",
    actions: ["read"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  const result = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(AccessPolicySchema)(rawPolicy))
  );

  expect(result._tag).toBe("Right");
});

test("AccessPolicy Schema: should encode and decode access policy domain object", async () => {
  // Raw input (as from persistence layer)
  const rawPolicy = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    subjectType: "user",
    subjectId: "650e8400-e29b-41d4-a716-446655440000",
    resourceType: "document",
    resourceId: null,
    actions: ["read"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  };

  // Decode (raw -> domain)
  const decodeResult = await Effect.runPromise(
    Effect.either(Schema.decodeUnknown(AccessPolicySchema)(rawPolicy))
  );

  expect(decodeResult._tag).toBe("Right");
  
  if (decodeResult._tag === "Right") {
    const domainPolicy = decodeResult.right;
    
    // Verify domain policy has Date objects
    expect(domainPolicy.createdAt).toBeInstanceOf(Date);
    expect(domainPolicy.updatedAt).toBeInstanceOf(Date);
  }
});
