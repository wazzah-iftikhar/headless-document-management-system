/**
 * Use Case Integration Test Helpers
 * 
 * Utilities for testing use cases with real repositories and test database.
 * Provides helpers for common use case integration testing patterns.
 */

import { Effect, Layer, pipe } from "effect";
import type { TestDatabaseSetup } from "../database";
import { DatabaseService } from "../../effect/services/database.service";
import type { UseCaseError } from "../../application/errors/use-case.errors";
import {
  DocumentRepositoryImpl,
  UserRepositoryImpl,
  AccessPolicyRepositoryImpl,
  DocumentVersionRepositoryImpl,
} from "../../infrastructure/repositories/implementations";

/**
 * Create a complete test layer with all repositories and database service
 */
export function createUseCaseTestLayer(
  testDb: TestDatabaseSetup
): Layer.Layer<DatabaseService> {
  return Layer.succeed(DatabaseService, testDb.db);
}

/**
 * Execute a use case with test database and real repositories
 * 
 * @param useCaseEffect - Effect from use case execution
 * @param testDb - Test database setup
 * @returns Promise resolving to the result
 */
export async function executeUseCaseIntegration<T, E extends UseCaseError>(
  useCaseEffect: Effect.Effect<T, E, DatabaseService>,
  testDb: TestDatabaseSetup
): Promise<T> {
  return Effect.runPromise(
    Effect.provide(useCaseEffect, createUseCaseTestLayer(testDb))
  );
}

/**
 * Execute a use case and expect it to fail
 * 
 * @param useCaseEffect - Effect from use case execution
 * @param testDb - Test database setup
 * @returns Promise resolving to the error
 */
export async function executeUseCaseIntegrationExpectError<E extends UseCaseError>(
  useCaseEffect: Effect.Effect<any, E, DatabaseService>,
  testDb: TestDatabaseSetup
): Promise<E> {
  return Effect.runPromise(
    pipe(
      useCaseEffect,
      Effect.provide(createUseCaseTestLayer(testDb)),
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

/**
 * Use case integration test context
 * Provides common setup for use case integration tests
 */
export class UseCaseIntegrationTestContext {
  public documentRepo: DocumentRepositoryImpl;
  public userRepo: UserRepositoryImpl;
  public accessPolicyRepo: AccessPolicyRepositoryImpl;
  public documentVersionRepo: DocumentVersionRepositoryImpl;

  constructor(public testDb: TestDatabaseSetup) {
    // Initialize repositories (they'll use the test database via DatabaseService)
    this.documentRepo = new DocumentRepositoryImpl();
    this.userRepo = new UserRepositoryImpl();
    this.accessPolicyRepo = new AccessPolicyRepositoryImpl();
    this.documentVersionRepo = new DocumentVersionRepositoryImpl();
  }

  /**
   * Execute use case
   */
  async execute<T, E extends UseCaseError>(
    useCaseEffect: Effect.Effect<T, E, DatabaseService>
  ): Promise<T> {
    return executeUseCaseIntegration(useCaseEffect, this.testDb);
  }

  /**
   * Execute use case and expect error
   */
  async executeExpectError<E extends UseCaseError>(
    useCaseEffect: Effect.Effect<any, E, DatabaseService>
  ): Promise<E> {
    return executeUseCaseIntegrationExpectError(useCaseEffect, this.testDb);
  }

  /**
   * Get test layer
   */
  getLayer(): Layer.Layer<DatabaseService> {
    return createUseCaseTestLayer(this.testDb);
  }
}

/**
 * Setup use case integration test context
 */
export function setupUseCaseIntegrationTest(
  testDb: TestDatabaseSetup
): UseCaseIntegrationTestContext {
  return new UseCaseIntegrationTestContext(testDb);
}
