# Test Database Setup

This directory contains utilities for setting up isolated test databases using Testcontainers.

## Features

- **PostgreSQL Testcontainers**: Isolated PostgreSQL instances for each test run
- **Migration Runner**: Automatically runs database migrations
- **Seed Scripts**: Deterministic test data generation using fixtures
- **Test Isolation**: Clean database state for each test

## Structure

```
test/database/
├── testcontainers-setup.ts    # Testcontainers PostgreSQL setup
├── migration-runner.ts         # Migration execution for test databases
├── seed-scripts.ts             # Seed data generation
├── test-database-helper.ts    # Complete setup/teardown utilities
└── index.ts                    # Main exports
```

## Usage

### Basic Setup

```typescript
import { setupTestDatabase, teardownTestDatabase } from "./test/database";

describe("Integration Tests", () => {
  let testDb: TestDatabaseSetup;

  beforeAll(async () => {
    testDb = await setupTestDatabase({
      runMigrations: true,
      seedData: true,
    });
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
  });

  it("should work with test database", async () => {
    // Test implementation using testDb.db
  });
});
```

### Setup Without Seeding

```typescript
import { setupTestDatabaseWithoutSeeding } from "./test/database";

const testDb = await setupTestDatabaseWithoutSeeding();
// Database is migrated but empty
```

### Custom Seed Data

```typescript
import { setupTestDatabaseWithCustomSeed } from "./test/database";

const testDb = await setupTestDatabaseWithCustomSeed({
  documentCount: 10,
  userCount: 5,
  policyCount: 8,
  versionCountPerDocument: 5,
});
```

### Test Isolation

```typescript
describe("Isolated Tests", () => {
  let testDb: TestDatabaseSetup;

  beforeAll(async () => {
    testDb = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
  });

  beforeEach(async () => {
    // Clear and reseed between tests for isolation
    await testDb.clear();
    await testDb.reseed();
  });

  it("test 1", async () => {
    // Fresh database state
  });

  it("test 2", async () => {
    // Fresh database state
  });
});
```

### Manual Migration and Seeding

```typescript
import { 
  startTestDatabase,
  migrateUp,
  seedAll,
  clearAll 
} from "./test/database";

const testDb = await startTestDatabase();

// Run migrations
const migrations = await loadMigrations();
await migrateUp(testDb.db, migrations);

// Seed data
await seedAll(testDb.db, {
  documentCount: 5,
  userCount: 3,
});

// Cleanup
await clearAll(testDb.db);
await testDb.stop();
```

## API Reference

### `setupTestDatabase(options?)`

Complete test database setup with migrations and optional seeding.

**Options:**
- `runMigrations?: boolean` - Run migrations (default: `true`)
- `seedData?: boolean` - Seed test data (default: `true`)
- `seedOptions?: object` - Seed configuration
  - `documentCount?: number` - Number of documents to seed (default: 5)
  - `userCount?: number` - Number of users to seed (default: 5)
  - `policyCount?: number` - Number of policies to seed (default: 5)
  - `versionCountPerDocument?: number` - Versions per document (default: 3)

**Returns:** `TestDatabaseSetup` with:
- `db` - Drizzle database instance
- `container` - Testcontainers container
- `connectionString` - Database connection string
- `sql` - Postgres client
- `cleanup()` - Cleanup function
- `reseed()` - Clear and reseed data
- `clear()` - Clear all data

### `teardownTestDatabase(setup)`

Teardown test database and stop container.

### `startTestDatabase()`

Start a PostgreSQL test container (low-level).

### `migrateUp(db, migrations?)`

Run migrations on test database.

### `seedAll(db, options?)`

Seed all test data.

### `clearAll(db)`

Clear all seed data.

## Best Practices

1. **Use `beforeAll` for setup**: Start containers once per test suite
2. **Use `afterAll` for teardown**: Stop containers after all tests
3. **Use `beforeEach` for isolation**: Clear/reseed between tests if needed
4. **Reuse containers**: Don't create new containers for each test (slow)
5. **Clean between tests**: Use `clear()` or `reseed()` for test isolation

## Performance

- **Container startup**: ~2-5 seconds (first time)
- **Migrations**: ~1-2 seconds
- **Seeding**: ~100-500ms (depending on data volume)
- **Container reuse**: Fast (no startup overhead)

## Troubleshooting

### Container fails to start
- Ensure Docker is running
- Check Docker has enough resources
- Try pulling the image manually: `docker pull postgres:16-alpine`

### Migration errors
- Check migration files exist in `./drizzle`
- Verify SQL syntax is compatible with PostgreSQL
- Check migration order (should be sorted)

### Seed data issues
- Ensure migrations ran successfully
- Check foreign key constraints
- Verify UUID format is correct

## Notes

- Testcontainers requires Docker to be running
- PostgreSQL containers are isolated per test run
- Data is automatically cleaned up when container stops
- Migrations are run in order (sorted by filename)
