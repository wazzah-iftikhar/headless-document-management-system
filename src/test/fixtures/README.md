# Test Fixtures and Factories

This directory contains test fixtures and factories for generating deterministic, realistic test data.

## Structure

```
test/fixtures/
├── utils/              # Utility functions for generating test data
│   ├── uuid-generator.ts
│   ├── date-generator.ts
│   └── checksum-generator.ts
├── factories/
│   ├── domain/         # Domain entity factories
│   │   ├── document.factory.ts
│   │   ├── user.factory.ts
│   │   ├── access-policy.factory.ts
│   │   └── document-version.factory.ts
│   ├── dto/            # DTO factories (commands, queries, results)
│   │   ├── document-dto.factory.ts
│   │   └── access-control-dto.factory.ts
│   └── persistence/   # Persistence model factories
│       ├── document-persistence.factory.ts
│       ├── user-persistence.factory.ts
│       ├── access-policy-persistence.factory.ts
│       └── document-version-persistence.factory.ts
└── index.ts            # Main export file
```

## Features

### Deterministic Generation
All factories use seed-based generation to ensure:
- **Consistent test data** across test runs
- **Predictable UUIDs** and dates
- **Repeatable test scenarios**

### Realistic Data
Factories generate realistic test data that:
- Follows domain constraints
- Uses proper formats (UUIDs, ISO dates, etc.)
- Includes sensible defaults

### Flexible Options
All factories accept options to customize generated data:
- Override specific fields
- Use index-based generation for multiple entities
- Create variations (draft/published documents, admin/users, etc.)

## Usage

### Basic Usage

```typescript
import { 
  createDocumentDomain,
  createCreateDocumentCommand,
  createDocumentPersistence 
} from "./test/fixtures";

// Create a document domain entity
const document = createDocumentDomain({ index: 0 });

// Create a command DTO
const command = createCreateDocumentCommand({ index: 0 });

// Create a persistence model
const persistence = createDocumentPersistence({ index: 0 });
```

### Test Isolation

```typescript
import { resetUuidSeed } from "./test/fixtures";

beforeEach(() => {
  // Reset seed for test isolation
  resetUuidSeed();
});
```

### Creating Multiple Entities

```typescript
import { createDocumentDomains } from "./test/fixtures";

// Create 10 documents
const documents = createDocumentDomains(10);
```

### Customizing Generated Data

```typescript
import { createDocumentDomain } from "./test/fixtures";

// Override specific fields
const document = createDocumentDomain({
  filename: "custom-document.pdf",
  metadataTags: ["custom", "tags"],
  fileSize: 2048,
});
```

### Specialized Factories

```typescript
import { 
  createDraftDocument,
  createPublishedDocument,
  createAdminUser,
  createUserPolicy 
} from "./test/fixtures";

// Create documents with specific statuses
const draft = createDraftDocument();
const published = createPublishedDocument();

// Create users with specific roles
const admin = createAdminUser();

// Create specific policies
const policy = createUserPolicy(userId, documentId, ["read", "write"]);
```

## Factory Categories

### Domain Entity Factories
- `createDocumentDomain()` - Create document domain entities
- `createUserDomain()` - Create user domain entities
- `createAccessPolicyDomain()` - Create access policy domain entities
- `createDocumentVersionDomain()` - Create document version domain entities

### DTO Factories
- **Commands**: `createCreateDocumentCommand()`, `createInitiateUploadCommand()`, etc.
- **Queries**: `createGetDocumentQuery()`, `createListDocumentsQuery()`, etc.
- **Results**: `createDocumentResult()`, `createUploadInitiationResult()`, etc.

### Persistence Factories
- `createDocumentPersistence()` - Create document persistence models
- `createUserPersistence()` - Create user persistence models
- `createAccessPolicyPersistence()` - Create access policy persistence models
- `createDocumentVersionPersistence()` - Create document version persistence models

## Utilities

### UUID Generation
```typescript
import { generateTestUuid, resetUuidSeed } from "./test/fixtures";

const uuid1 = generateTestUuid(0); // Deterministic UUID
const uuid2 = generateTestUuid(1); // Different deterministic UUID
```

### Date Generation
```typescript
import { generateTestDate, generateTestDateString } from "./test/fixtures";

const date = generateTestDate(0); // Date based on index
const dateString = generateTestDateString(0); // ISO string
```

### Checksum Generation
```typescript
import { generateTestChecksum } from "./test/fixtures";

const checksum = generateTestChecksum(0); // Deterministic SHA-256 checksum
```

## Best Practices

1. **Reset seed in beforeEach** for test isolation
2. **Use index parameter** for creating multiple related entities
3. **Override specific fields** rather than creating completely custom data
4. **Use specialized factories** for common scenarios (draft/published, admin/user, etc.)
5. **Keep test data realistic** - use factories rather than hardcoding values

## Examples

### Integration Test Setup

```typescript
import { 
  createDocumentDomain,
  createUserDomain,
  createAccessPolicyDomain,
  resetUuidSeed 
} from "./test/fixtures";

describe("Document Access Control", () => {
  beforeEach(() => {
    resetUuidSeed();
  });

  it("should allow access based on policy", async () => {
    const user = createUserDomain({ index: 0 });
    const document = createDocumentDomain({ index: 0 });
    const policy = createUserPolicy(
      user.id,
      document.id,
      ["read", "write"]
    );
    
    // Test implementation...
  });
});
```

### Use Case Testing

```typescript
import { 
  createCreateDocumentCommand,
  createDocumentResult 
} from "./test/fixtures";

it("should create a document", async () => {
  const command = createCreateDocumentCommand({ index: 0 });
  const result = await useCase.execute(command);
  
  expect(result).toMatchObject({
    filename: command.filename,
    originalFilename: command.originalFilename,
  });
});
```
