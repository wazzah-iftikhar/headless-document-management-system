# Integration Tests with Testcontainers

## Overview

Integration tests use Testcontainers to spin up a Postgres database for testing repository implementations and E2E workflows.

## Current Status

⚠️ **Note**: The current repository implementations use SQLite-specific Drizzle schemas (`sqliteTable`). For full Postgres integration test support, Postgres-compatible schemas (`pgTable`) would need to be created.

The integration test structure is in place and can be extended when Postgres schemas are available.

## Test Structure

- **E2E Workflows**: Tests the complete flow: create document → add version → fetch latest → update → list
- **Repository CRUD**: Tests all CRUD operations for each repository
- **Pagination**: Verifies pagination works correctly
- **Query Performance**: Tests that indexes are used for lookups
- **Seed Data**: Uses deterministic seed data for reproducible tests

## Running Tests

```bash
bun test src/infrastructure/repositories/__tests__/integration.test.ts
```

## Requirements

- Docker (for Testcontainers)
- `@testcontainers/postgresql` package
- `postgres` package

## Future Work

To enable full Postgres integration tests:

1. Create Postgres-compatible schemas using `pgTable` from `drizzle-orm/pg-core`
2. Update repository implementations to support both SQLite and Postgres
3. Create a database adapter layer that abstracts the differences
