# Test Infrastructure

Comprehensive testing infrastructure for the headless document management system.

## Structure

```
test/
├── fixtures/              # Test fixtures and factories
│   ├── utils/            # UUID, date, checksum generators
│   ├── factories/        # Domain, DTO, persistence factories
│   └── README.md
├── database/             # Test database setup
│   ├── testcontainers-setup.ts
│   ├── migration-runner.ts
│   ├── seed-scripts.ts
│   ├── test-database-helper.ts
│   └── README.md
├── integration/          # Integration tests
│   ├── workflow.test.ts
│   ├── use-case-helpers.ts
│   └── README.md
└── utils/                # Test utilities
    ├── repository-test-helpers.ts
    ├── repository-assertions.ts
    ├── repository-test-builders.ts
    ├── use-case-integration-helpers.ts
    └── README.md
```

## Features

### Test Fixtures
- ✅ Deterministic UUID, date, and checksum generation
- ✅ Domain entity factories (Document, User, AccessPolicy, DocumentVersion)
- ✅ DTO factories (commands, queries, results)
- ✅ Persistence model factories

### Test Database
- ✅ Testcontainers PostgreSQL setup
- ✅ Automatic migration execution
- ✅ Seed scripts with deterministic data
- ✅ Test isolation and cleanup

### Integration Tests
- ✅ Complete workflow tests (create → upload → publish)
- ✅ Use case integration testing
- ✅ Error handling tests
- ✅ Business logic verification

### Test Utilities
- ✅ Repository testing helpers
- ✅ Use case integration testing helpers
- ✅ Repository assertions
- ✅ Test data builders

## Quick Start

### Running Tests

```bash
# Run all tests
bun test

# Run integration tests
bun test src/test/integration

# Run with coverage
bun test --coverage
```

### Writing Repository Tests

```typescript
import { RepositoryTestContext, documentBuilder } from "./test/utils";
import { DocumentRepositoryImpl } from "../../infrastructure/repositories";

describe("Document Repository", () => {
  let repoContext: RepositoryTestContext;

  beforeAll(async () => {
    const testDb = await setupTestDatabase();
    repoContext = new RepositoryTestContext(testDb);
  });

  it("should create document", async () => {
    const repo = new DocumentRepositoryImpl();
    const data = documentBuilder()
      .withFilename("test.pdf")
      .buildCreateData();

    const result = await repoContext.execute(repo.create(data));
    expect(result).toBeDefined();
  });
});
```

### Writing Use Case Integration Tests

```typescript
import { UseCaseIntegrationTestContext } from "./test/utils";
import { CreateDocumentUseCase } from "../../application/use-cases";

describe("Create Document Use Case", () => {
  let useCaseContext: UseCaseIntegrationTestContext;

  beforeAll(async () => {
    const testDb = await setupTestDatabase();
    useCaseContext = setupUseCaseIntegrationTest(testDb);
  });

  it("should create document", async () => {
    const useCase = new CreateDocumentUseCase();
    const command = createCreateDocumentCommand({ index: 0 });

    const result = await useCaseContext.execute(useCase.execute(command));
    expect(result.filename).toBeDefined();
  });
});
```

## Test Infrastructure Components

### 1. Test Fixtures (`test/fixtures/`)

Provides deterministic test data generation:
- UUID generators with seed-based generation
- Date generators for consistent timestamps
- Checksum generators for file validation
- Factories for all domain entities, DTOs, and persistence models

### 2. Test Database (`test/database/`)

Provides isolated test database setup:
- Testcontainers PostgreSQL instances
- Automatic migration execution
- Seed data generation
- Test isolation and cleanup

### 3. Integration Tests (`test/integration/`)

Tests complete workflows:
- Document lifecycle (create → upload → publish)
- Use case orchestration
- Business logic verification
- Error handling

### 4. Test Utilities (`test/utils/`)

Provides testing helpers:
- Repository testing utilities
- Use case integration testing utilities
- Repository assertions
- Test data builders

## Best Practices

1. **Use test fixtures**: Generate test data with factories
2. **Reset UUID seed**: Use `resetUuidSeed()` in `beforeEach`
3. **Clear database**: Use `testDb.clear()` for test isolation
4. **Use builders**: Fluent API for building test data
5. **Use assertions**: Focus on behavior, not implementation
6. **Test behavior**: Verify workflows, not implementation details

## Requirements

- **Docker**: Required for Testcontainers (PostgreSQL)
- **Bun**: Test runtime
- **Test database**: Automatically set up with Testcontainers

## Test Coverage

- ✅ Domain entities (factories)
- ✅ DTOs (factories)
- ✅ Persistence models (factories)
- ✅ Repository operations (utilities)
- ✅ Use case orchestration (integration tests)
- ✅ Complete workflows (end-to-end tests)

## Documentation

- `test/fixtures/README.md` - Test fixtures documentation
- `test/database/README.md` - Test database setup documentation
- `test/integration/README.md` - Integration tests documentation
- `test/utils/README.md` - Test utilities documentation
