import { test, expect } from "bun:test";
import { Effect } from "effect";
import { RoleVO, UserRole } from "../../user/value-objects/role.vo";
test("RoleVO: should create from valid role string", async () => {
  const result = await Effect.runPromise(
    RoleVO.fromString(UserRole.ADMIN)
  );

  expect(result).toBeInstanceOf(RoleVO);
  expect(result.toString()).toBe(UserRole.ADMIN);
});

test("RoleVO: should fail with invalid role", async () => {
  const result = await Effect.runPromise(
    Effect.either(RoleVO.fromString("invalid-role"))
  );

  expect(result._tag).toBe("Left");
});

test("RoleVO: should fail with empty string", async () => {
  const result = await Effect.runPromise(
    Effect.either(RoleVO.fromString(""))
  );

  expect(result._tag).toBe("Left");
});

test("RoleVO: should create admin role", () => {
  const role = RoleVO.admin();
  expect(role.getValue()).toBe(UserRole.ADMIN);
  expect(role.isAdmin()).toBe(true);
});

test("RoleVO: should create manager role", () => {
  const role = RoleVO.manager();
  expect(role.getValue()).toBe(UserRole.MANAGER);
});

test("RoleVO: should create editor role", () => {
  const role = RoleVO.editor();
  expect(role.getValue()).toBe(UserRole.EDITOR);
});

test("RoleVO: should create viewer role", () => {
  const role = RoleVO.viewer();
  expect(role.getValue()).toBe(UserRole.VIEWER);
});

test("RoleVO: should identify admin role", () => {
  const role = RoleVO.admin();
  expect(role.isAdmin()).toBe(true);
  expect(role.isManagerOrHigher()).toBe(true);
});

test("RoleVO: should identify manager or higher", () => {
  const manager = RoleVO.manager();
  const admin = RoleVO.admin();
  const editor = RoleVO.editor();

  expect(manager.isManagerOrHigher()).toBe(true);
  expect(admin.isManagerOrHigher()).toBe(true);
  expect(editor.isManagerOrHigher()).toBe(false);
});

test("RoleVO: should be equal when roles are the same", () => {
  const role1 = RoleVO.admin();
  const role2 = RoleVO.admin();

  expect(role1.equals(role2)).toBe(true);
});

test("RoleVO: should not be equal when roles are different", () => {
  const role1 = RoleVO.admin();
  const role2 = RoleVO.viewer();

  expect(role1.equals(role2)).toBe(false);
});

test("RoleVO: should encode to string", () => {
  const role = RoleVO.admin();
  expect(role.encode()).toBe(UserRole.ADMIN);
  expect(typeof role.encode()).toBe("string");
});
