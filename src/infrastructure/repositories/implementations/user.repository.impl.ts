import { Effect, pipe } from "effect";
import { eq, desc, asc, sql } from "drizzle-orm";
import type { RepoError } from "../../../errors/repository.errors";
import { toRepoError } from "../../../errors/repository.errors";
import { DatabaseService } from "../../../effect/services/database.service";
import type { Paginated, PaginationParams } from "../../../types/pagination";
import { DEFAULT_PAGINATION, calculatePaginationMeta } from "../../../types/pagination";
import type { UserPersistence } from "../../../domain/user/user.entity.schema";
import type { IUserRepository } from "../contracts/user.repository.contract";
import { users } from "../../database/schemas/users.schema";
import type { UserRow, NewUserRow } from "../../database/schemas/users.schema";

/**
 * User Repository Implementation
 */
export class UserRepositoryImpl implements IUserRepository {
  private mapRowToDomain(row: UserRow): UserPersistence {
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      workspaceIds: row.workspaceIds, // Already JSON string
      isActive: row.isActive === "1" || row.isActive === "true",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapDomainToRow(
    data: Omit<UserPersistence, "id" | "createdAt" | "updatedAt">
  ): Omit<NewUserRow, "id" | "createdAt" | "updatedAt"> {
    return {
      email: data.email,
      role: data.role,
      workspaceIds: data.workspaceIds, // JSON string
      isActive: data.isActive ? "1" : "0",
    };
  }

  create(
    data: Omit<UserPersistence, "id" | "createdAt" | "updatedAt">
  ): Effect.Effect<UserPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const row = this.mapDomainToRow(data);
            const result = await db.insert(users).values(row).returning();

            if (!result[0]) {
              throw new Error("Failed to create user");
            }

            return this.mapRowToDomain(result[0]);
          },
          catch: (error) => toRepoError(error),
        })
      )
    );
  }

  findById(id: string): Effect.Effect<UserPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () => db.select().from(users).where(eq(users.id, id)).limit(1),
            catch: (error) => toRepoError(error),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail({
                _tag: "UserNotFound",
                userId: id,
              } as RepoError);
            }
            return Effect.succeed(this.mapRowToDomain(rows[0]));
          })
        )
      )
    );
  }

  findByEmail(email: string): Effect.Effect<UserPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () => db.select().from(users).where(eq(users.email, email)).limit(1),
            catch: (error) => toRepoError(error),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail({
                _tag: "UserNotFound",
                userId: email, // Using email as identifier for error
              } as RepoError);
            }
            return Effect.succeed(this.mapRowToDomain(rows[0]));
          })
        )
      )
    );
  }

  findAll(
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<UserPersistence>, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const params = { ...DEFAULT_PAGINATION, ...pagination };
            const offset = (params.page - 1) * params.limit;
            const orderBy =
              params.sortOrder === "asc"
                ? asc(users[params.sortBy as keyof typeof users] || users.createdAt)
                : desc(users[params.sortBy as keyof typeof users] || users.createdAt);

            const countResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(users);
            const total = Number(countResult[0]?.count || 0);

            const rows = await db
              .select()
              .from(users)
              .orderBy(orderBy)
              .limit(params.limit)
              .offset(offset);

            return {
              data: rows.map((row) => this.mapRowToDomain(row)),
              meta: calculatePaginationMeta(total, params.page, params.limit),
            };
          },
          catch: (error) => toRepoError(error),
        })
      )
    );
  }

  update(
    id: string,
    data: Partial<Omit<UserPersistence, "id" | "createdAt">>
  ): Effect.Effect<UserPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: async () => {
              const updateData: Partial<NewUserRow> = {
                ...(data.email && { email: data.email }),
                ...(data.role && { role: data.role }),
                ...(data.workspaceIds && { workspaceIds: data.workspaceIds }),
                ...(data.isActive !== undefined && {
                  isActive: data.isActive ? "1" : "0",
                }),
                updatedAt: new Date().toISOString(),
              };

              const result = await db
                .update(users)
                .set(updateData)
                .where(eq(users.id, id))
                .returning();

              if (!result[0]) {
                throw new Error("User not found");
              }

              return this.mapRowToDomain(result[0]);
            },
            catch: (error) => toRepoError(error),
          }),
          Effect.mapError((error) => {
            if (error instanceof Error && error.message === "User not found") {
              return { _tag: "UserNotFound", userId: id } as RepoError;
            }
            return toRepoError(error);
          })
        )
      )
    );
  }

  delete(id: string): Effect.Effect<void, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: async () => {
              const existing = await db
                .select()
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

              if (!existing[0]) {
                throw new Error("User not found");
              }

              await db.delete(users).where(eq(users.id, id));
            },
            catch: (error) => toRepoError(error),
          }),
          Effect.mapError((error) => {
            if (error instanceof Error && error.message === "User not found") {
              return { _tag: "UserNotFound", userId: id } as RepoError;
            }
            return toRepoError(error);
          }),
          Effect.map(() => undefined)
        )
      )
    );
  }
}
