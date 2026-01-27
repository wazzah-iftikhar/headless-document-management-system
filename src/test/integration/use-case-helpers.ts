/**
 * Use Case Testing Helpers
 * 
 * Provides utilities for testing use cases with Effect and test database.
 */

import { Effect, Layer, pipe } from "effect";
import { DatabaseService } from "../../effect/services/database.service";
import type { TestDatabaseSetup } from "../database";

/**
 * Create a database service layer for testing
 */
export function createTestDatabaseLayer(
  testDb: TestDatabaseSetup
): Layer.Layer<DatabaseService> {
  return Layer.succeed(DatabaseService, testDb.db);
}

/**
 * Execute a use case with test database
 * 
 * @param useCaseEffect - Effect from use case execution
 * @param testDb - Test database setup
 * @returns Promise resolving to the result
 */
export async function executeUseCaseWithTestDb<T, E>(
  useCaseEffect: Effect.Effect<T, E, DatabaseService>,
  testDb: TestDatabaseSetup
): Promise<T> {
  return Effect.runPromise(
    Effect.provide(useCaseEffect, createTestDatabaseLayer(testDb))
  );
}

/**
 * Execute a use case and expect it to fail
 * 
 * @param useCaseEffect - Effect from use case execution
 * @param testDb - Test database setup
 * @returns Promise resolving to the error
 */
export async function executeUseCaseExpectError<E>(
  useCaseEffect: Effect.Effect<any, E, DatabaseService>,
  testDb: TestDatabaseSetup
): Promise<E> {
  return Effect.runPromise(
    pipe(
      useCaseEffect,
      Effect.provide(createTestDatabaseLayer(testDb)),
      Effect.either,
      Effect.flatMap((either) => {
        if (either._tag === "Left") {
          return Effect.succeed(either.left);
        }
        return Effect.fail(new Error("Expected use case to fail, but it succeeded"));
      })
    )
  );
}

