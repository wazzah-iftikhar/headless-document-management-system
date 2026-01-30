# Architecture Best Practices

## Current Architecture: Hexagonal (Ports & Adapters)

Your codebase follows **Hexagonal Architecture** principles. Here are the best practices for this pattern:

## Best Practice: Keep Both (Recommended for Most Cases)

### ✅ **Recommended Approach: Dual API Support**

**Keep both HTTP controllers AND oRPC procedures** because:

1. **Different Use Cases**
   - **HTTP/REST**: Public APIs, web browsers, legacy clients, file uploads
   - **oRPC**: Internal services, type-safe clients, modern frontends

2. **Separation of Concerns**
   - Controllers handle **HTTP-specific concerns** (status codes, multipart, headers)
   - Procedures handle **RPC-specific concerns** (type safety, contracts)

3. **Flexibility**
   - Support multiple client types
   - Gradual migration path
   - Backward compatibility

### Architecture Pattern

```
┌─────────────────────────────────────────┐
│     PRESENTATION LAYER (Adapters)       │
│                                         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │ HTTP Routes  │    │ oRPC Routes  │ │
│  │   (REST)     │    │   (RPC)      │ │
│  └──────┬───────┘    └──────┬───────┘ │
│         │                   │          │
│  ┌──────▼───────┐    ┌──────▼───────┐ │
│  │ Controllers  │    │  Procedures  │ │
│  │ (HTTP layer) │    │  (RPC layer) │ │
│  └──────┬───────┘    └──────┬───────┘ │
└─────────┼────────────────────┼─────────┘
          │                    │
          └──────────┬─────────┘
                     │
┌────────────────────▼────────────────────┐
│      APPLICATION LAYER (Core)           │
│      Use Cases (Shared Business Logic)   │
└──────────────────────────────────────────┘
```

## Best Practices by Scenario

### Scenario 1: Modern Application (Recommended)
**Use: oRPC as Primary, HTTP as Fallback**

```typescript
// Primary: oRPC for type-safe clients
const client = createRouterClient<ApiRouter>({
  baseURL: "http://localhost:3000/rpc"
});

// Fallback: HTTP for legacy/external clients
fetch("http://localhost:3000/documents")
```

**Benefits:**
- ✅ End-to-end type safety
- ✅ Better developer experience
- ✅ Automatic client generation
- ✅ Backward compatible

**Keep Controllers:** ✅ Yes (for HTTP fallback)

---

### Scenario 2: Public API / External Consumers
**Use: HTTP/REST Only**

**Benefits:**
- ✅ Standard REST conventions
- ✅ Works with any HTTP client
- ✅ Easy to document (OpenAPI/Swagger)
- ✅ No client library required

**Keep Controllers:** ✅ Yes (required)

---

### Scenario 3: Internal Services / Microservices
**Use: oRPC Only**

**Benefits:**
- ✅ Type safety across services
- ✅ Better performance (no HTTP overhead)
- ✅ Simpler codebase (no controllers)
- ✅ Automatic contract validation

**Keep Controllers:** ❌ No (can remove)

---

## Code Organization Best Practices

### ✅ Current Structure (Good)

```
src/presentation/
├── controllers/     # HTTP-specific adapters
├── routes/         # HTTP route definitions
├── orpc/           # RPC-specific adapters
│   ├── procedures/ # RPC procedures
│   └── server.ts   # RPC server setup
└── middleware/     # Shared middleware
```

**Why this is good:**
- Clear separation of HTTP vs RPC concerns
- Both use same use cases (DRY)
- Easy to maintain and test

### ❌ Anti-Pattern: Duplicating Logic

```typescript
// ❌ BAD: Duplicating business logic
// In Controller
if (document.status === "draft") {
  // business logic here
}

// In Procedure
if (document.status === "draft") {
  // same business logic duplicated
}
```

### ✅ Good: Shared Use Cases

```typescript
// ✅ GOOD: Both use same use cases
// Controller
useCases.publishDocument.execute(command)

// Procedure
useCases.publishDocument.execute(input)
```

## When to Remove Controllers

### ✅ Safe to Remove If:

1. **No HTTP clients exist**
   - All clients can use oRPC
   - No public API needed
   - Internal services only

2. **Migration complete**
   - All clients migrated to oRPC
   - HTTP endpoints deprecated
   - No backward compatibility needed

3. **Simpler architecture desired**
   - Single API surface
   - Less code to maintain
   - Team prefers RPC

### ❌ Keep Controllers If:

1. **Public API exists**
   - External consumers
   - Web browsers
   - Mobile apps

2. **File uploads needed**
   - HTTP handles multipart/form-data better
   - oRPC can handle files but HTTP is simpler

3. **Legacy clients**
   - Existing integrations
   - Third-party tools
   - Webhooks

## Recommended Approach for Your Codebase

### ✅ **Keep Both (Current Setup)**

**Reasons:**
1. **Flexibility**: Support both modern (oRPC) and traditional (HTTP) clients
2. **File Uploads**: HTTP handles `multipart/form-data` better for file uploads
3. **Public API**: If this becomes a public API, REST is more standard
4. **Gradual Migration**: Can migrate clients to oRPC over time

### Optimization: Extract Shared Logic

If you want to reduce duplication, extract shared logic:

```typescript
// Shared service (not controller)
export class DocumentPresentationService {
  static async executeUseCase<T>(
    useCase: UseCase,
    input: any
  ): Promise<T> {
    return Effect.runPromise(
      pipe(
        useCase.execute(input),
        Effect.provide(AppLayer),
        Effect.mapError(handleError)
      )
    );
  }
}

// Controller uses it
DocumentPresentationService.executeUseCase(
  useCases.listDocuments,
  query
)

// Procedure uses it
DocumentPresentationService.executeUseCase(
  useCases.listDocuments,
  input
)
```

## Industry Best Practices

### 1. **Hexagonal Architecture Principle**
- ✅ Presentation layer = adapters (HTTP, RPC, CLI, etc.)
- ✅ Multiple adapters can exist simultaneously
- ✅ All adapters use same application layer

### 2. **API Design**
- **Internal Services**: Prefer RPC (type-safe, faster)
- **Public APIs**: Prefer REST (standard, universal)
- **Both**: Best of both worlds

### 3. **Type Safety**
- oRPC provides end-to-end type safety
- HTTP requires manual type checking
- Modern apps prefer type safety

### 4. **Maintainability**
- Keep adapters thin (just mapping)
- Business logic in use cases
- Shared validation in application layer

## Recommendation for Your Project

### ✅ **Keep Current Setup (Both)**

**Why:**
1. You have file uploads (HTTP handles this better)
2. Flexibility for future clients
3. Follows hexagonal architecture (multiple adapters)
4. No duplication (both use same use cases)

**Action Items:**
- ✅ Keep controllers for HTTP routes
- ✅ Keep oRPC procedures for RPC
- ✅ Both call same use cases (already done)
- ✅ Consider extracting shared error handling

### Future Optimization

If you want to reduce code, you could:
1. Create shared presentation service
2. Both controllers and procedures use it
3. Reduces duplication while keeping both APIs

But this is **optional** - your current setup is already following best practices!
