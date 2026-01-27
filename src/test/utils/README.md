# Test Utilities

Test utilities for repository testing and use case integration testing.

## Structure

```
test/utils/
├── repository-test-helpers.ts      # Repository testing utilities
├── repository-assertions.ts        # Repository assertion helpers
├── repository-test-builders.ts     # Test data builders for repositories
├── use-case-integration-helpers.ts # Use case integration testing utilities
├── index.ts                         # Main exports
└── README.md                        # This file
```

## Repository Testing Utilities

### Basic Usage

```typescript
import { RepositoryTestContext } from "./test/utils";
import { DocumentRepositoryImpl } from "../../infrastructure/repositories";

describe("Document Repository Tests", () => {
  let repoContext: RepositoryTestContext;

  beforeAll(async () => {
    const testDb = await setupTestDatabase();
    repoContext = new RepositoryTestContext(testDb);
  });

  it("should create a document", async () => {
    const repo = new DocumentRepositoryImpl();
    const result = await repoContext.execute(
      repo.create(createData)
    );
    expect(result).toBeDefined();
  });
});
```

### Repository Test Context

The `RepositoryTestContext` provides:

- `execute(repoEffect)` - Execute repository operation
- `executeExpectError(repoEffect)` - Execute and expect error
- `getLayer()` - Get Effect layer for manual composition

### Repository Assertions

```typescript
import { assertDocumentMatches, assertDocumentCreated } from "./test/utils";

// Assert document matches expected values
assertDocumentMatches(result, {
  filename: "test.pdf",
  fileSize: 1000,
});

// Assert document was created correctly
assertDocumentCreated(result, {
  filename: "test.pdf",
  originalFilename: "original.pdf",
  filePath: "/documents/test.pdf",
  fileSize: 1000,
  metadataTags: ["test"],
});
```

### Test Data Builders

```typescript
import { documentBuilder, userBuilder } from "./test/utils";

// Fluent API for building test data
const document = documentBuilder()
  .withFilename("test.pdf")
  .withOriginalFilename("original.pdf")
  .withFileSize(1000)
  .withMetadataTags(["test", "example"])
  .build();

// Build create data (without id, timestamps)
const createData = documentBuilder()
  .withFilename("test.pdf")
  .buildCreateData();
```

## Use Case Integration Testing

### Basic Usage

```typescript
import { UseCaseIntegrationTestContext } from "./test/utils";
import { CreateDocumentUseCase } from "../../application/use-cases";

describe("Use Case Integration Tests", () => {
  let useCaseContext: UseCaseIntegrationTestContext;

  beforeAll(async () => {
    const testDb = await setupTestDatabase();
    useCaseContext = setupUseCaseIntegrationTest(testDb);
  });

  it("should execute use case", async () => {
    const useCase = new CreateDocumentUseCase();
    const result = await useCaseContext.execute(
      useCase.execute(command)
    );
    expect(result).toBeDefined();
  });
});
```

### Use Case Integration Test Context

The `UseCaseIntegrationTestContext` provides:

- Pre-initialized repositories
- `execute(useCaseEffect)` - Execute use case
- `executeExpectError(useCaseEffect)` - Execute and expect error
- `getLayer()` - Get Effect layer

### Available Repositories

The context provides access to:
- `documentRepo` - DocumentRepositoryImpl
- `userRepo` - UserRepositoryImpl
- `accessPolicyRepo` - AccessPolicyRepositoryImpl
- `documentVersionRepo` - DocumentVersionRepositoryImpl

## Test Data Builders

### Document Builder

```typescript
const document = documentBuilder()
  .withId("custom-id")
  .withFilename("test.pdf")
  .withOriginalFilename("original.pdf")
  .withFilePath("/documents/test.pdf")
  .withFileSize(1000)
  .withChecksum("abc123...")
  .withMetadataTags(["test", "example"])
  .withIndex(0) // For deterministic generation
  .build();
```

### User Builder

```typescript
const user = userBuilder()
  .withId("user-id")
  .withEmail("user@example.com")
  .withRole("admin")
  .withWorkspaceIds(["workspace-1", "workspace-2"])
  .withIsActive(true)
  .withIndex(0)
  .build();
```

### Access Policy Builder

```typescript
const policy = accessPolicyBuilder()
  .withId("policy-id")
  .withSubjectType("user")
  .withSubjectId("user-id")
  .withResourceType("document")
  .withResourceId("document-id")
  .withActions(["read", "write"])
  .withIsActive(true)
  .withIndex(0)
  .build();
```

### Document Version Builder

```typescript
const version = documentVersionBuilder()
  .withId("version-id")
  .withDocumentId("document-id")
  .withVersionNumber(1)
  .withIndex(0)
  .build();
```

## Assertion Helpers

### Document Assertions

- `assertDocumentMatches(actual, expected)` - Assert document matches expected values
- `assertDocumentCreated(document, expectedData)` - Assert document was created correctly
- `assertDocumentUpdated(before, after, expectedChanges)` - Assert document was updated

### User Assertions

- `assertUserMatches(actual, expected)` - Assert user matches expected values

### Access Policy Assertions

- `assertAccessPolicyMatches(actual, expected)` - Assert policy matches expected values

### Document Version Assertions

- `assertDocumentVersionMatches(actual, expected)` - Assert version matches expected values

### Pagination Assertions

- `assertPaginatedResult(result, expectedCount?, expectedPage?, expectedLimit?)` - Assert paginated result structure

## Best Practices

1. **Use builders for test data**: Fluent API makes tests readable
2. **Use assertions**: Focus on behavior, not implementation
3. **Reset builders**: Call `resetBuilders()` in `beforeEach` for isolation
4. **Use test context**: Provides clean API for repository/use case testing
5. **Test behavior**: Focus on what the repository/use case does, not how

## Examples

### Repository Test

```typescript
it("should create and find document", async () => {
  const createData = documentBuilder()
    .withFilename("test.pdf")
    .buildCreateData();

  const created = await repoContext.execute(
    documentRepo.create(createData)
  );

  const found = await repoContext.execute(
    documentRepo.findById(created.id)
  );

  assertDocumentMatches(found, {
    id: created.id,
    filename: "test.pdf",
  });
});
```

### Use Case Integration Test

```typescript
it("should create document via use case", async () => {
  const command = createCreateDocumentCommand({
    filename: "test.pdf",
    index: 0,
  });

  const useCase = new CreateDocumentUseCase();
  const result = await useCaseContext.execute(
    useCase.execute(command)
  );

  expect(result.filename).toBe("test.pdf");
});
```

## Notes

- All utilities work with test database from Testcontainers
- Builders use test fixtures for deterministic data
- Assertions handle JSON string parsing automatically
- Test contexts provide clean API for Effect composition
