import { test, expect } from "bun:test";
import * as fc from "fast-check";
import { Effect } from "effect";
import { DocumentAccessService } from "../../document-access/document-access.service";
import { PermissionAction } from "../../access-policy/value-objects/permission-action.vo";
import { UserFactory } from "../factories/user.factory";
import { DocumentFactory } from "../factories/document.factory";
import { AccessPolicyFactory } from "../factories/access-policy.factory";
import { UserRole } from "../../user/value-objects/role.vo";

/**
 * Property-based tests for Access Control
 * 
 * These tests verify that access control rules hold for all valid inputs,
 * ensuring invariants are maintained across different scenarios.
 */

// UUID v4 generator
const uuidV4Generator = fc
  .tuple(
    fc.string({ minLength: 8, maxLength: 8 }).filter((s) => /^[0-9a-f]{8}$/i.test(s)),
    fc.string({ minLength: 4, maxLength: 4 }).filter((s) => /^[0-9a-f]{4}$/i.test(s)),
    fc.constant("4"),
    fc.string({ minLength: 3, maxLength: 3 }).filter((s) => /^[0-9a-f]{3}$/i.test(s)),
    fc.constantFrom("8", "9", "a", "b"),
    fc.string({ minLength: 3, maxLength: 3 }).filter((s) => /^[0-9a-f]{3}$/i.test(s)),
    fc.string({ minLength: 12, maxLength: 12 }).filter((s) => /^[0-9a-f]{12}$/i.test(s))
  )
  .map((parts) => `${parts[0]}-${parts[1]}-${parts[2]}${parts[3]}-${parts[4]}${parts[5]}-${parts[6]}`);
const permissionActionGenerator = fc.constantFrom(
  PermissionAction.READ,
  PermissionAction.WRITE,
  PermissionAction.DELETE,
  PermissionAction.SHARE,
  PermissionAction.MANAGE
);

// Access Control Property-Based Tests
test("Admin users should always have all permissions regardless of policies", async () => {
  const admin = await Effect.runPromise(UserFactory.createAdmin());
  const document = await Effect.runPromise(DocumentFactory.createDefault());

  await fc.assert(
    fc.asyncProperty(
      permissionActionGenerator,
      async (action) => {
        const validPolicies: any[] = [];
        const result = await Effect.runPromise(
          DocumentAccessService.evaluatePermission(
            admin,
            validPolicies,
            document,
            action
          )
        );
        return result === true;
      }
    ),
    { numRuns: 50 }
  );
});

test("Inactive users should always be denied access", async () => {
  await fc.assert(
    fc.asyncProperty(
      uuidV4Generator,
      permissionActionGenerator,
      async (userId, action) => {
        const inactiveUser = await Effect.runPromise(
          UserFactory.create({ id: userId, isActive: false })
        );
        const document = await Effect.runPromise(DocumentFactory.createDefault());

        const result = await Effect.runPromise(
          Effect.either(
            DocumentAccessService.evaluatePermission(
              inactiveUser,
              [],
              document,
              action
            )
          )
        );
        return result._tag === "Left" && result.left._tag === "UserNotActive";
      }
    ),
    { numRuns: 50 }
  );
});

test("Users with no matching policies should always be denied", async () => {
  await fc.assert(
    fc.asyncProperty(
      uuidV4Generator,
      permissionActionGenerator,
      async (userId, action) => {
        const user = await Effect.runPromise(
          UserFactory.create({ id: userId, role: UserRole.VIEWER })
        );
        const document = await Effect.runPromise(DocumentFactory.createDefault());

        // Create policies for different user/role/workspace
        const otherUserId = "999e8400-e29b-41d4-a716-446655440000";
        const policy = await Effect.runPromise(
          AccessPolicyFactory.createForUser(otherUserId, [PermissionAction.READ])
        );

        const result = await Effect.runPromise(
          DocumentAccessService.evaluatePermission(
            user,
            [policy],
            document,
            action
          )
        );
        return result === false;
      }
    ),
    { numRuns: 50 }
  );
});

test("Wildcard policies (resourceId: null) should match any document", async () => {
  await fc.assert(
    fc.asyncProperty(
      uuidV4Generator,
      uuidV4Generator, // Different document ID
      permissionActionGenerator,
      async (userId, documentId, action) => {
        const user = await Effect.runPromise(
          UserFactory.create({ id: userId })
        );
        const document = await Effect.runPromise(
          DocumentFactory.createWithId(documentId)
        );

        // Wildcard policy applies to all documents
        const wildcardPolicy = await Effect.runPromise(
          AccessPolicyFactory.createForUser(userId, [action])
        );

        const result = await Effect.runPromise(
          DocumentAccessService.evaluatePermission(
            user,
            [wildcardPolicy],
            document,
            action
          )
        );
        return result === true;
      }
    ),
    { numRuns: 50 }
  );
});

test("Higher-level actions should always include lower-level actions", async () => {
  await fc.assert(
    fc.asyncProperty(
      uuidV4Generator,
      async (userId) => {
        const user = await Effect.runPromise(
          UserFactory.create({ id: userId })
        );
        const document = await Effect.runPromise(DocumentFactory.createDefault());

        // Policy with MANAGE should allow all actions
        const managePolicy = await Effect.runPromise(
          AccessPolicyFactory.createForUser(userId, [PermissionAction.MANAGE])
        );

        const allActions = [
          PermissionAction.READ,
          PermissionAction.WRITE,
          PermissionAction.DELETE,
          PermissionAction.SHARE,
          PermissionAction.MANAGE,
        ];

        for (const action of allActions) {
          const result = await Effect.runPromise(
            DocumentAccessService.evaluatePermission(
              user,
              [managePolicy],
              document,
              action
            )
          );
          if (!result) {
            throw new Error(`MANAGE policy should allow ${action} but returned false`);
          }
        }
        return true;
      }
    ),
    { numRuns: 50 }
  );
});

test("Precedence order should always be maintained (admin > user > role > workspace)", async () => {
  await fc.assert(
    fc.asyncProperty(
      uuidV4Generator,
      uuidV4Generator,
      async (userId, workspaceId) => {
        // Create user with role and workspace
        const user = await Effect.runPromise(
          UserFactory.create({
            id: userId,
            role: UserRole.VIEWER,
            workspaceIds: [workspaceId],
          })
        );
        const document = await Effect.runPromise(DocumentFactory.createDefault());

        // Create conflicting policies at different levels
        const userPolicy = await Effect.runPromise(
          AccessPolicyFactory.createForUser(userId, [PermissionAction.WRITE])
        );
        const rolePolicy = await Effect.runPromise(
          AccessPolicyFactory.createForRole(UserRole.VIEWER, [
            PermissionAction.READ,
          ])
        );
        const workspacePolicy = await Effect.runPromise(
          AccessPolicyFactory.createForWorkspace(workspaceId, [
            PermissionAction.DELETE,
          ])
        );

        // User policy should take precedence (WRITE includes READ)
        const writeResult = await Effect.runPromise(
          DocumentAccessService.evaluatePermission(
            user,
            [userPolicy, rolePolicy, workspacePolicy],
            document,
            PermissionAction.WRITE
          )
        );
        if (!writeResult) {
          throw new Error("User policy should allow WRITE");
        }

        // READ should also work (WRITE includes READ)
        const readResult = await Effect.runPromise(
          DocumentAccessService.evaluatePermission(
            user,
            [userPolicy, rolePolicy, workspacePolicy],
            document,
            PermissionAction.READ
          )
        );
        if (!readResult) {
          throw new Error("WRITE policy should include READ");
        }

        // DELETE should not work (only in workspace policy, but user policy takes precedence)
        const deleteResult = await Effect.runPromise(
          DocumentAccessService.evaluatePermission(
            user,
            [userPolicy, rolePolicy, workspacePolicy],
            document,
            PermissionAction.DELETE
          )
        );
        if (deleteResult) {
          throw new Error("DELETE should be denied (not in user policy)");
        }
        return true;
      }
    ),
    { numRuns: 30 }
  );
});

test("Inactive policies should always be ignored", async () => {
  await fc.assert(
    fc.asyncProperty(
      uuidV4Generator,
      permissionActionGenerator,
      async (userId, action) => {
        const user = await Effect.runPromise(
          UserFactory.create({ id: userId })
        );
        const document = await Effect.runPromise(DocumentFactory.createDefault());

        // Create inactive policy
        const inactivePolicy = await Effect.runPromise(
          AccessPolicyFactory.create({
            subjectType: "user",
            subjectId: userId,
            isActive: false,
            actions: [action],
          })
        );

        const result = await Effect.runPromise(
          DocumentAccessService.evaluatePermission(
            user,
            [inactivePolicy],
            document,
            action
          )
        );
        return result === false;
      }
    ),
    { numRuns: 50 }
  );
});
