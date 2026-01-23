import { Effect, pipe } from "effect";
import { eq, and, desc, asc, sql, isNull } from "drizzle-orm";
import type { RepoError } from "../../../errors/repository.errors";
import { toRepoError } from "../../../errors/repository.errors";
import { DatabaseService } from "../../../effect/services/database.service";
import type { Paginated, PaginationParams } from "../../../types/pagination";
import { DEFAULT_PAGINATION, calculatePaginationMeta } from "../../../types/pagination";
import type { AccessPolicyPersistence } from "../../../domain/access-policy/access-policy.entity.schema";
import type { IAccessPolicyRepository } from "../contracts/access-policy.repository.contract";
import { accessPolicies } from "../../database/schemas/access-policies.schema";
import type { AccessPolicyRow, NewAccessPolicyRow } from "../../database/schemas/access-policies.schema";

/**
 * Access Policy Repository Implementation
 */
export class AccessPolicyRepositoryImpl implements IAccessPolicyRepository {
  private mapRowToDomain(row: AccessPolicyRow): AccessPolicyPersistence {
    return {
      id: row.id,
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      resourceType: row.resourceType,
      resourceId: row.resourceId ?? undefined,
      actions: row.actions, // Already JSON string
      isActive: row.isActive === "1" || row.isActive === "true",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapDomainToRow(
    data: Omit<AccessPolicyPersistence, "id" | "createdAt" | "updatedAt">
  ): Omit<NewAccessPolicyRow, "id" | "createdAt" | "updatedAt"> {
    return {
      subjectType: data.subjectType,
      subjectId: data.subjectId,
      resourceType: data.resourceType,
      resourceId: data.resourceId ?? null,
      actions: data.actions, // JSON string
      isActive: data.isActive ? "1" : "0",
    };
  }

  create(
    data: Omit<AccessPolicyPersistence, "id" | "createdAt" | "updatedAt">
  ): Effect.Effect<AccessPolicyPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const row = this.mapDomainToRow(data);
            const result = await db.insert(accessPolicies).values(row).returning();

            if (!result[0]) {
              throw new Error("Failed to create access policy");
            }

            return this.mapRowToDomain(result[0]);
          },
          catch: (error) => toRepoError(error),
        })
      )
    );
  }

  findById(id: string): Effect.Effect<AccessPolicyPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: () =>
              db
                .select()
                .from(accessPolicies)
                .where(eq(accessPolicies.id, id))
                .limit(1),
            catch: (error) => toRepoError(error),
          }),
          Effect.flatMap((rows) => {
            if (!rows[0]) {
              return Effect.fail({
                _tag: "AccessPolicyNotFound",
                policyId: id,
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
  ): Effect.Effect<Paginated<AccessPolicyPersistence>, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const params = { ...DEFAULT_PAGINATION, ...pagination };
            const offset = (params.page - 1) * params.limit;
            const orderBy =
              params.sortOrder === "asc"
                ? asc(
                    accessPolicies[params.sortBy as keyof typeof accessPolicies] ||
                      accessPolicies.createdAt
                  )
                : desc(
                    accessPolicies[params.sortBy as keyof typeof accessPolicies] ||
                      accessPolicies.createdAt
                  );

            const countResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(accessPolicies);
            const total = Number(countResult[0]?.count || 0);

            const rows = await db
              .select()
              .from(accessPolicies)
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

  findBySubject(
    subjectType: "user" | "role" | "workspace",
    subjectId: string,
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<AccessPolicyPersistence>, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const params = { ...DEFAULT_PAGINATION, ...pagination };
            const offset = (params.page - 1) * params.limit;

            const whereClause = and(
              eq(accessPolicies.subjectType, subjectType),
              eq(accessPolicies.subjectId, subjectId)
            );

            const countResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(accessPolicies)
              .where(whereClause);
            const total = Number(countResult[0]?.count || 0);

            const rows = await db
              .select()
              .from(accessPolicies)
              .where(whereClause)
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

  findByResource(
    resourceType: string,
    resourceId: string | null,
    pagination?: PaginationParams
  ): Effect.Effect<Paginated<AccessPolicyPersistence>, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        Effect.tryPromise({
          try: async () => {
            const params = { ...DEFAULT_PAGINATION, ...pagination };
            const offset = (params.page - 1) * params.limit;

            const whereClause =
              resourceId === null
                ? and(eq(accessPolicies.resourceType, resourceType), isNull(accessPolicies.resourceId))
                : and(
                    eq(accessPolicies.resourceType, resourceType),
                    eq(accessPolicies.resourceId, resourceId)
                  );

            const countResult = await db
              .select({ count: sql<number>`count(*)` })
              .from(accessPolicies)
              .where(whereClause);
            const total = Number(countResult[0]?.count || 0);

            const rows = await db
              .select()
              .from(accessPolicies)
              .where(whereClause)
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
    data: Partial<Omit<AccessPolicyPersistence, "id" | "createdAt">>
  ): Effect.Effect<AccessPolicyPersistence, RepoError, DatabaseService> {
    return pipe(
      DatabaseService,
      Effect.flatMap((db) =>
        pipe(
          Effect.tryPromise({
            try: async () => {
              const updateData: Partial<NewAccessPolicyRow> = {
                ...(data.subjectType && { subjectType: data.subjectType }),
                ...(data.subjectId && { subjectId: data.subjectId }),
                ...(data.resourceType && { resourceType: data.resourceType }),
                ...(data.resourceId !== undefined && {
                  resourceId: data.resourceId ?? null,
                }),
                ...(data.actions && { actions: data.actions }),
                ...(data.isActive !== undefined && {
                  isActive: data.isActive ? "1" : "0",
                }),
                updatedAt: new Date().toISOString(),
              };

              const result = await db
                .update(accessPolicies)
                .set(updateData)
                .where(eq(accessPolicies.id, id))
                .returning();

              if (!result[0]) {
                throw new Error("Access policy not found");
              }

              return this.mapRowToDomain(result[0]);
            },
            catch: (error) => toRepoError(error),
          }),
          Effect.mapError((error) => {
            if (error instanceof Error && error.message === "Access policy not found") {
              return { _tag: "AccessPolicyNotFound", policyId: id } as RepoError;
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
                .from(accessPolicies)
                .where(eq(accessPolicies.id, id))
                .limit(1);

              if (!existing[0]) {
                throw new Error("Access policy not found");
              }

              await db.delete(accessPolicies).where(eq(accessPolicies.id, id));
            },
            catch: (error) => toRepoError(error),
          }),
          Effect.mapError((error) => {
            if (error instanceof Error && error.message === "Access policy not found") {
              return { _tag: "AccessPolicyNotFound", policyId: id } as RepoError;
            }
            return toRepoError(error);
          }),
          Effect.map(() => undefined)
        )
      )
    );
  }
}
