import { Effect } from "effect";
import type { UserDomain } from "../../user/user.entity.schema";
import { UserIdVO } from "../../user/value-objects/user-id.vo";
import { EmailVO } from "../../user/value-objects/email.vo";
import { RoleVO, UserRole } from "../../user/value-objects/role.vo";
import { WorkspaceIdVO } from "../../user/value-objects/workspace-id.vo";
import { DateTimeVO } from "../../document/value-objects/date-time.vo";

/**
 * User Test Factory
 * 
 * Provides deterministic test data generation for User entities.
 * All factories use fixed UUIDs and predictable data for reproducible tests.
 */
export class UserFactory {
  // Fixed UUIDs for deterministic testing
  private static readonly FIXED_USER_ID = "00000000-0000-4000-8000-000000000001";
  private static readonly FIXED_WORKSPACE_ID = "00000000-0000-4000-8000-000000000010";
  private static readonly FIXED_WORKSPACE_ID_2 = "00000000-0000-4000-8000-000000000011";

  /**
   * Create a default user with all required fields
   */
  static createDefault(): Effect.Effect<UserDomain> {
    return Effect.all([
      UserIdVO.fromString(this.FIXED_USER_ID),
      EmailVO.fromString("test@example.com"),
      RoleVO.fromString(UserRole.VIEWER),
      WorkspaceIdVO.fromString(this.FIXED_WORKSPACE_ID),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, email, role, workspaceId, createdAt]) => ({
        id: id.getValue(),
        email: email.getValue(),
        role: role.getValue(),
        workspaceIds: [workspaceId.getValue()],
        isActive: true,
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a user with custom properties
   */
  static create(overrides?: Partial<UserDomain>): Effect.Effect<UserDomain> {
    return this.createDefault().pipe(
      Effect.map((user) => ({
        ...user,
        ...overrides,
        // Ensure workspaceIds is always an array
        workspaceIds: overrides?.workspaceIds ?? user.workspaceIds,
      }))
    );
  }

  /**
   * Create an admin user
   */
  static createAdmin(): Effect.Effect<UserDomain> {
    return Effect.all([
      UserIdVO.fromString(this.FIXED_USER_ID),
      EmailVO.fromString("admin@example.com"),
      Effect.succeed(RoleVO.admin()),
      WorkspaceIdVO.fromString(this.FIXED_WORKSPACE_ID),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, email, role, workspaceId, createdAt]) => ({
        id: id.getValue(),
        email: email.getValue(),
        role: role.getValue(),
        workspaceIds: [workspaceId.getValue()],
        isActive: true,
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a manager user
   */
  static createManager(): Effect.Effect<UserDomain> {
    return this.create({ role: UserRole.MANAGER });
  }

  /**
   * Create an editor user
   */
  static createEditor(): Effect.Effect<UserDomain> {
    return this.create({ role: UserRole.EDITOR });
  }

  /**
   * Create a viewer user
   */
  static createViewer(): Effect.Effect<UserDomain> {
    return this.create({ role: UserRole.VIEWER });
  }

  /**
   * Create an inactive user
   */
  static createInactive(): Effect.Effect<UserDomain> {
    return this.create({ isActive: false });
  }

  /**
   * Create a user with multiple workspaces
   */
  static createWithMultipleWorkspaces(): Effect.Effect<UserDomain> {
    return Effect.all([
      UserIdVO.fromString(this.FIXED_USER_ID),
      EmailVO.fromString("multi-workspace@example.com"),
      RoleVO.fromString(UserRole.EDITOR),
      WorkspaceIdVO.fromString(this.FIXED_WORKSPACE_ID),
      WorkspaceIdVO.fromString(this.FIXED_WORKSPACE_ID_2),
      DateTimeVO.fromISOString("2024-01-01T00:00:00.000Z"),
    ]).pipe(
      Effect.map(([id, email, role, workspaceId1, workspaceId2, createdAt]) => ({
        id: id.getValue(),
        email: email.getValue(),
        role: role.getValue(),
        workspaceIds: [workspaceId1.getValue(), workspaceId2.getValue()],
        isActive: true,
        createdAt: createdAt.getValue(),
        updatedAt: createdAt.getValue(),
      }))
    );
  }

  /**
   * Create a user with a specific ID
   */
  static createWithId(userId: string): Effect.Effect<UserDomain> {
    return this.create({ id: userId });
  }

  /**
   * Create a user with a specific email
   */
  static createWithEmail(email: string): Effect.Effect<UserDomain> {
    return this.create({ email });
  }

  /**
   * Create a user with a specific role
   */
  static createWithRole(role: UserRole): Effect.Effect<UserDomain> {
    return this.create({ role });
  }
}
