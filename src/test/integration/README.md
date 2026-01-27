# Integration Tests

Integration tests for complete application workflows using test database with Testcontainers.

## Structure

```
test/integration/
├── workflow.test.ts        # Complete workflow tests (create → upload → publish)
├── use-case-helpers.ts     # Utilities for testing use cases with Effect
└── index.ts                # Main exports
```

## Test Coverage

### Complete Workflow Tests

Tests the full document lifecycle:

1. **Create Document** - Create document with metadata only
2. **Initiate Upload** - Get upload token and URL
3. **Confirm Upload** - Persist file and create version
4. **Publish Document** - Change document status

### Test Scenarios

- ✅ **Complete workflow**: Create → Upload → Publish
- ✅ **Multiple uploads**: Versioning with multiple file uploads
- ✅ **Idempotent uploads**: Duplicate upload detection via checksum
- ✅ **Status transitions**: Valid transitions (draft → published → archived)
- ✅ **Invalid transitions**: Rejection of invalid status changes

## Usage

### Running Tests

```bash
# Run all integration tests
bun test src/test/integration

# Run specific test file
bun test src/test/integration/workflow.test.ts
```

### Test Setup

Tests use:
- **Testcontainers**: Isolated PostgreSQL instances
- **Test fixtures**: Deterministic test data generation
- **Test database**: Automatic setup/teardown with migrations

### Example Test

```typescript
import { setupTestDatabase, teardownTestDatabase } from "../database";
import { CreateDocumentUseCase } from "../../application/use-cases";
import { executeUseCaseWithTestDb } from "./use-case-helpers";

describe("Document Workflow", () => {
  let testDb: TestDatabaseSetup;

  beforeAll(async () => {
    testDb = await setupTestDatabase({
      runMigrations: true,
      seedData: false,
    });
  });

  afterAll(async () => {
    await teardownTestDatabase(testDb);
  });

  it("should create a document", async () => {
    const useCase = new CreateDocumentUseCase();
    const result = await executeUseCaseWithTestDb(
      useCase.execute(command),
      testDb
    );
    expect(result).toBeDefined();
  });
});
```

## Test Utilities

### `executeUseCaseWithTestDb`

Execute a use case with test database:

```typescript
const result = await executeUseCaseWithTestDb(
  useCase.execute(command),
  testDb
);
```

### `executeUseCaseExpectError`

Execute a use case and expect it to fail:

```typescript
const error = await executeUseCaseExpectError(
  useCase.execute(command),
  testDb
);
expect(error).toMatchObject({ _tag: "ExpectedError" });
```

## Test Isolation

- **Database isolation**: Each test suite gets a fresh database
- **Data cleanup**: Database cleared between tests (`beforeEach`)
- **Deterministic data**: UUID seed reset for consistent test data

## Workflow Test Details

### Complete Workflow Test

Tests the full document lifecycle:

1. Create document with metadata
2. Initiate upload (get token)
3. Confirm upload (persist file, create version)
4. Verify document updated
5. Publish document
6. Verify final state

### Versioning Test

Tests multiple uploads create new versions:

- First upload → version 1
- Second upload (different checksum) → version 2
- Document updated with latest file info

### Idempotency Test

Tests duplicate upload detection:

- First upload → version 1
- Second upload (same checksum) → returns version 1 (idempotent)

### Status Transition Test

Tests valid status transitions:

- Draft → Published ✅
- Published → Archived ✅
- Published → Draft ❌ (rejected)

## Best Practices

1. **Use test fixtures**: Generate test data with factories
2. **Reset UUID seed**: Use `resetUuidSeed()` in `beforeEach`
3. **Clear database**: Use `testDb.clear()` for isolation
4. **Test behavior**: Focus on workflow behavior, not implementation
5. **Isolated tests**: Each test should be independent

## Notes

- Tests require Docker to be running (for Testcontainers)
- Database migrations run automatically on setup
- Test data is deterministic using seed-based generation
- All tests use the same test database instance (shared in `beforeAll`)
