import { test, expect } from "bun:test";
import { Effect } from "effect";
import { DocumentAccessService } from "../../document-access/document-access.service";
import { PermissionAction } from "../../access-policy/value-objects/permission-action.vo";
import { UserFactory } from "../factories/user.factory";
import { DocumentFactory } from "../factories/document.factory";
import { AccessPolicyFactory } from "../factories/access-policy.factory";
import { UserRole } from "../../user/value-objects/role.vo";

const documentId = "550e8400-e29b-41d4-a716-446655440000";
const userId = "650e8400-e29b-41d4-a716-446655440000";
const workspaceId = "750e8400-e29b-41d4-a716-446655440000";

// Precedence Tests
test("DocumentAccessService: should grant access to admin users (highest precedence)", async () => {
  const admin = await Effect.runPromise(UserFactory.createAdmin());
  const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));
  const policies: any[] = [];

  // Verify admin is active
  expect(admin.isActive).toBe(true);
  expect(admin.role).toBe(UserRole.ADMIN);

  const result = await Effect.runPromise(
    DocumentAccessService.evaluatePermission(
      admin,
      policies,
      document,
      PermissionAction.MANAGE
    )
  );

  expect(result).toBe(true);
});

test("DocumentAccessService: should check explicit user policy before role policy", async () => {
    const user = await Effect.runPromise(
      UserFactory.create({ id: userId, role: UserRole.VIEWER })
    );
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    // User-specific policy (should take precedence)
    const userPolicy = await Effect.runPromise(
      AccessPolicyFactory.createForUser(userId, [PermissionAction.WRITE])
    );

    // Role policy (should be ignored)
    const rolePolicy = await Effect.runPromise(
      AccessPolicyFactory.createForRole(UserRole.VIEWER, [PermissionAction.READ])
    );

    const policies = [userPolicy, rolePolicy];

    // Should have WRITE (from user policy), not just READ (from role policy)
    const writeResult = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.WRITE
      )
    );
    expect(writeResult).toBe(true);

    const readResult = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(readResult).toBe(true); // WRITE includes READ
  });

test("DocumentAccessService: should check role policy before workspace policy", async () => {
    const user = await Effect.runPromise(
      UserFactory.create({
        id: userId,
        role: UserRole.EDITOR,
        workspaceIds: [workspaceId],
      })
    );
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    // Role policy (should take precedence)
    const rolePolicy = await Effect.runPromise(
      AccessPolicyFactory.createForRole(UserRole.EDITOR, [PermissionAction.WRITE])
    );

    // Workspace policy (should be ignored)
    const workspacePolicy = await Effect.runPromise(
      AccessPolicyFactory.createForWorkspace(workspaceId, [PermissionAction.READ])
    );

    const policies = [rolePolicy, workspacePolicy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.WRITE
      )
    );
    expect(result).toBe(true);
  });

test("DocumentAccessService: should check workspace policy when no user or role policy exists", async () => {
    const user = await Effect.runPromise(
      UserFactory.create({
        id: userId,
        role: UserRole.VIEWER,
        workspaceIds: [workspaceId],
      })
    );
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    const workspacePolicy = await Effect.runPromise(
      AccessPolicyFactory.createForWorkspace(workspaceId, [PermissionAction.READ])
    );

    const policies = [workspacePolicy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(result).toBe(true);
  });

test("DocumentAccessService: should deny access when no policy matches", async () => {
    const user = await Effect.runPromise(UserFactory.createDefault());
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));
    const policies: any[] = [];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );

    expect(result).toBe(false);
  });

// User Validation Tests
test("DocumentAccessService: should fail for inactive user", async () => {
    const inactiveUser = await Effect.runPromise(
      UserFactory.create({ id: userId, isActive: false })
    );
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));
    const policies: any[] = [];

    const result = await Effect.runPromise(
      Effect.either(
        DocumentAccessService.evaluatePermission(
          inactiveUser,
          policies,
          document,
          PermissionAction.READ
        )
      )
    );

    expect(result._tag).toBe("Left");
    if (result._tag === "Left") {
      expect(result.left._tag).toBe("UserNotActive");
    }
  });

// Policy Matching Tests
test("DocumentAccessService: should match wildcard policy (resourceId: null) for any document", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    // Wildcard policy applies to all documents
    const wildcardPolicy = await Effect.runPromise(
      AccessPolicyFactory.createForUser(userId, [PermissionAction.READ])
    );

    const policies = [wildcardPolicy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(result).toBe(true);
  });

test("DocumentAccessService: should match specific document policy", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    const specificPolicy = await Effect.runPromise(
      AccessPolicyFactory.createForDocument(
        documentId,
        "user",
        userId,
        [PermissionAction.READ]
      )
    );

    const policies = [specificPolicy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(result).toBe(true);
  });

test("DocumentAccessService: should not match policy for different document", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));
    const otherDocumentId = "850e8400-e29b-41d4-a716-446655440000";

    const policyForOtherDoc = await Effect.runPromise(
      AccessPolicyFactory.createForDocument(
        otherDocumentId,
        "user",
        userId,
        [PermissionAction.READ]
      )
    );

    const policies = [policyForOtherDoc];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(result).toBe(false);
  });

test("DocumentAccessService: should ignore inactive policies", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    const inactivePolicy = await Effect.runPromise(
      AccessPolicyFactory.create({ isActive: false })
    );

    const policies = [inactivePolicy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(result).toBe(false);
  });

// Action Matching Tests
test("DocumentAccessService: should allow action when policy includes exact action", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    const policy = await Effect.runPromise(
      AccessPolicyFactory.createForUser(userId, [PermissionAction.READ])
    );

    const policies = [policy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(result).toBe(true);
  });

test("DocumentAccessService: should allow lower-level action when policy has higher-level action", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    // Policy has MANAGE, should allow READ
    const policy = await Effect.runPromise(
      AccessPolicyFactory.createForUser(userId, [PermissionAction.MANAGE])
    );

    const policies = [policy];

    const readResult = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(readResult).toBe(true);

    const writeResult = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.WRITE
      )
    );
    expect(writeResult).toBe(true);

    const deleteResult = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.DELETE
      )
    );
    expect(deleteResult).toBe(true);
  });

test("DocumentAccessService: should deny action when policy does not include it", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    // Policy only has READ, should deny WRITE
    const policy = await Effect.runPromise(
      AccessPolicyFactory.createForUser(userId, [PermissionAction.READ])
    );

    const policies = [policy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.WRITE
      )
    );
    expect(result).toBe(false);
  });

// Multiple Permissions Tests
test("DocumentAccessService: should evaluate multiple permissions correctly", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    const policy = await Effect.runPromise(
      AccessPolicyFactory.createForUser(userId, [
        PermissionAction.READ,
        PermissionAction.WRITE,
      ])
    );

    const policies = [policy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluateMultiplePermissions(
        user,
        policies,
        document,
        [PermissionAction.READ, PermissionAction.WRITE, PermissionAction.DELETE]
      )
    );

    expect(result[PermissionAction.READ]).toBe(true);
    expect(result[PermissionAction.WRITE]).toBe(true);
    expect(result[PermissionAction.DELETE]).toBe(false);
  });

test("DocumentAccessService: should return all allowed actions", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    const policy = await Effect.runPromise(
      AccessPolicyFactory.createForUser(userId, [
        PermissionAction.READ,
        PermissionAction.WRITE,
      ])
    );

    const policies = [policy];

    const result = await Effect.runPromise(
      DocumentAccessService.getAllowedActions(user, policies, document)
    );

    expect(result).toContain(PermissionAction.READ);
    expect(result).toContain(PermissionAction.WRITE);
    expect(result).not.toContain(PermissionAction.DELETE);
    expect(result).not.toContain(PermissionAction.SHARE);
    expect(result).not.toContain(PermissionAction.MANAGE);
  });

// Edge Cases
test("DocumentAccessService: should handle empty policies array", async () => {
    const user = await Effect.runPromise(UserFactory.create({ id: userId }));
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        [],
        document,
        PermissionAction.READ
      )
    );
    expect(result).toBe(false);
  });

test("DocumentAccessService: should handle user with multiple workspaces", async () => {
    const workspaceId2 = "950e8400-e29b-41d4-a716-446655440000";
    const user = await Effect.runPromise(
      UserFactory.create({
        id: userId,
        workspaceIds: [workspaceId, workspaceId2],
      })
    );
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    const workspacePolicy = await Effect.runPromise(
      AccessPolicyFactory.createForWorkspace(workspaceId2, [PermissionAction.READ])
    );

    const policies = [workspacePolicy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(result).toBe(true);
  });

test("DocumentAccessService: should handle case-insensitive role matching", async () => {
    const user = await Effect.runPromise(
      UserFactory.create({ id: userId, role: UserRole.EDITOR })
    );
    const document = await Effect.runPromise(DocumentFactory.createWithId(documentId));

    // Policy uses lowercase role
    const rolePolicy = await Effect.runPromise(
      AccessPolicyFactory.createForRole("editor", [PermissionAction.READ])
    );

    const policies = [rolePolicy];

    const result = await Effect.runPromise(
      DocumentAccessService.evaluatePermission(
        user,
        policies,
        document,
        PermissionAction.READ
      )
    );
    expect(result).toBe(true);
  });
