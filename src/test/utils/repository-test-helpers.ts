/**
 * Repository Test Helpers
 * 
 * Utilities for testing repositories in isolation with test database.
 * Provides helpers for common repository testing patterns.
 */

import { Effect, pipe } from "effect";
import type { TestDatabaseSetup } from "../database";
import { DatabaseService } from "../../effect/services/database.service";
import { Layer } from "effect";
import type { RepoError } from "../../errors/repository.errors";

/**
 * Create a database service layer for repository testing
 */
export function createRepositoryTestLayer(
  testDb: TestDatabaseSetup
): Layer.Layer<DatabaseService> {
  return Layer.succeed(DatabaseService, testDb.db);
}

/**
 * Execute a repository operation with test database
 * 
 * @param repoEffect - Effect from repository operation
 * @param testDb - Test database setup
 * @returns Promise resolving to the result
 */
export async function executeRepositoryOperation<T, E extends RepoError>(
  repoEffect: Effect.Effect<T, E, DatabaseService>,
  testDb: TestDatabaseSetup
): Promise<T> {
  return Effect.runPromise(
    Effect.provide(repoEffect, createRepositoryTestLayer(testDb))
  );
}

/**
 * Execute a repository operation and expect it to fail
 * 
 * @param repoEffect - Effect from repository operation
 * @param testDb - Test database setup
 * @returns Promise resolving to the error
 */
export async function executeRepositoryOperationExpectError<E extends RepoError>(
  repoEffect: Effect.Effect<any, E, DatabaseService>,
  testDb: TestDatabaseSetup
): Promise<E> {
  return Effect.runPromise(
    pipe(
      repoEffect,
      Effect.provide(createRepositoryTestLayer(testDb)),
      Effect.either,
      Effect.flatMap((either) => {
        if (either._tag === "Left") {
          return Effect.succeed(either.left);
        }
        return Effect.fail(new Error("Expected repository operation to fail, but it succeeded"));
      })
    )
  );
}

/**
 * Assert that a repository operation succeeds
 */
export async function assertRepositorySucceeds<T>(
  operation: () => Promise<T>,
  expectedValue?: Partial<T>
): Promise<T> {
  const result = await operation();
  expect(result).toBeDefined();
  if (expectedValue) {
    expect(result).toMatchObject(expectedValue);
  }
  return result;
}

/**
 * Assert that a repository operation fails with specific error
 */
export async function assertRepositoryFails<E extends RepoError>(
  operation: () => Promise<any>,
  expectedError: Partial<E>
): Promise<E> {
  try {
    await operation();
    throw new Error("Expected repository operation to fail, but it succeeded");
  } catch (error) {
    expect(error).toMatchObject(expectedError);
    return error as E;
  }
}

/**
 * Repository test context
 * Provides common setup for repository tests
 */
export class RepositoryTestContext {
  constructor(public testDb: TestDatabaseSetup) {}

  /**
   * Execute repository operation
   */
  async execute<T, E extends RepoError>(
    repoEffect: Effect.Effect<T, E, DatabaseService>
  ): Promise<T> {
    return executeRepositoryOperation(repoEffect, this.testDb);
  }

  /**
   * Execute repository operation and expect error
   */
  async executeExpectError<E extends RepoError>(
    repoEffect: Effect.Effect<any, E, DatabaseService>
  ): Promise<E> {
    return executeRepositoryOperationExpectError(repoEffect, this.testDb);
  }

  /**
   * Create repository test layer
   */
  getLayer(): Layer.Layer<DatabaseService> {
    return createRepositoryTestLayer(this.testDb);
  }
}
