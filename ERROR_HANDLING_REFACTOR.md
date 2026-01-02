# Multi-Level Error Handling Refactoring Plan

Based on: https://dev-portal-fuma.vercel.app/docs/best-practices/backend/error-handling/multi-level-error-handling-with-monads

## Principle: Each Layer Only Knows Errors One Layer Deep

### Current State
- All layers use generic `Error` type
- Repository errors leak to controllers
- No clear error boundaries
- Hard to maintain and refactor

### Target State

#### 1. Repository Layer (`RepoError`)
- Exposes only infrastructure errors (DB-related)
- Returns `Effect.Effect<A, RepoError, R>`
- "Not found" should be modeled as `null` (Option), not error

#### 2. Service Layer (`ServiceError = DomainError | ServiceInfraError`)
- Maps `RepoError` → `ServiceInfraError` at boundary
- Converts `null` → `DomainError` (e.g., DocumentNotFound)
- Returns `Effect.Effect<A, ServiceError, R>`
- Controller never sees `RepoError`

#### 3. Controller Layer (`HttpError`)
- Maps `ServiceError` → `HttpError` at boundary
- Converts to HTTP status codes
- Routes never see `ServiceError`

## Implementation Steps

1. ✅ Create error type definitions
2. ⏳ Update repository methods to use `RepoError`
3. ⏳ Update service methods to:
   - Use `ServiceError` return type
   - Map `RepoError` → `ServiceInfraError` using `Effect.mapError`
   - Convert `null` → `DomainError`
4. ⏳ Update controller methods to:
   - Use `HttpError` return type
   - Map `ServiceError` → `HttpError` using `Effect.mapError`
   - Convert to HTTP responses

## Key Changes

### Repository
- Change `Error` → `RepoError`
- Use `toRepoError()` helper
- Return `null` for "not found" (let service convert to domain error)

### Service
- Change `Error` → `ServiceError`
- Use `mapRepoErrorToServiceError()` at boundaries
- Convert `null` to domain errors

### Controller
- Change `Error` → `HttpError`
- Use `mapServiceErrorToHttpError()` at boundaries
- Use `httpErrorToStatus()` for status codes

