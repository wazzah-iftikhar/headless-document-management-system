# Presentation Layer

The **Presentation Layer** is the HTTP/API layer that handles incoming HTTP requests, validates them, maps them to application layer DTOs, executes use cases, and returns HTTP responses.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HTTP Request → Routes → Controllers → Use Cases           │
│                                                             │
│  Components:                                                │
│  • Routes (HTTP endpoint definitions)                      │
│  • Controllers (Request/Response handling)                │
│  • Middleware (Validation, Auth, etc.)                     │
│  • Validations (Request/Response schemas)                  │
│  • Error Mappers (Use case errors → HTTP errors)            │
│  • Response Utilities (HTTP response formatting)           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                          │
│  (Use Cases, DTOs, Business Logic Orchestration)           │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Routes (`src/routes/`)

**Purpose**: Define HTTP endpoints and route handlers

**Responsibilities**:
- Define HTTP method (GET, POST, PUT, DELETE)
- Define URL paths and parameters
- Extract request data (body, params, query)
- Validate request data
- Call controller methods

**Example**:
```typescript
// src/routes/document.routes.ts
export const documentRoutes = new Elysia({ prefix: "/documents" })
  .get("/", async () => {
    return DocumentController.getAllDocuments();
  })
  .get("/:id", async ({ params }) => {
    const validation = validateParams(documentIdParamsSchema, params);
    if (validation.error) return validation.error.body;
    return DocumentController.getDocumentById(validation.data.id);
  })
  .post("/", async ({ body }) => {
    const validation = validateBody(createDocumentSchema, body);
    if (validation.error) return validation.error.body;
    return DocumentController.createDocument(validation.data);
  });
```

### 2. Controllers (`src/controllers/`)

**Purpose**: Map HTTP requests to use cases and use case results to HTTP responses

**Responsibilities**:
- Extract data from HTTP requests
- Map HTTP requests to application DTOs (commands/queries)
- Execute use cases
- Map use case results to HTTP responses
- Handle errors and map to HTTP status codes

**Example**:
```typescript
// src/controllers/document.controller.ts
export class DocumentController {
  static async getDocumentById(id: string) {
    const useCase = new GetDocumentUseCase();
    const query: GetDocumentQuery = { documentId: id };

    return Effect.runPromise(
      pipe(
        useCase.execute(query),
        Effect.provide(AppLayer),
        Effect.mapError((useCaseError) => mapUseCaseErrorToHttpError(useCaseError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            return {
              status: httpErrorToStatus(httpError),
              body: errorResponse(httpError.message),
            };
          },
          onSuccess: (result) => {
            return {
              status: 200,
              body: successResponse({
                id: result.id,
                filename: result.filename,
                // ... map use case result to HTTP response
              }),
            };
          },
        })
      )
    );
  }
}
```

### 3. Middleware (`src/middleware/`)

**Purpose**: Cross-cutting concerns (validation, authentication, etc.)

**Responsibilities**:
- Request validation
- Authentication/authorization
- Request/response transformation
- Error handling

**Example**:
```typescript
// src/middleware/schema-validator.ts
export function validateBody<T>(schema: Schema.Schema<T>, data: unknown) {
  const result = Schema.parseEither(schema)(data);
  if (result._tag === "Left") {
    return { error: { body: { status: 400, message: "Validation error" } } };
  }
  return { data: result.right };
}
```

### 4. Validations (`src/validations/`)

**Purpose**: Define schemas for HTTP request/response validation

**Responsibilities**:
- Define request body schemas
- Define query parameter schemas
- Define path parameter schemas
- Define response schemas

**Example**:
```typescript
// src/validations/document.schema.ts
export const documentIdParamsSchema = Schema.Struct({
  id: uuidSchema,
});

export const createDocumentSchema = Schema.Struct({
  filename: Schema.String,
  originalFilename: Schema.String,
  metadataTags: Schema.optional(Schema.Array(Schema.String)),
});
```

### 5. Error Mappers (`src/controllers/use-case-error-mapper.ts`)

**Purpose**: Map application layer errors to HTTP errors

**Responsibilities**:
- Map `UseCaseError` to `HttpError`
- Map error types to HTTP status codes
- Format error messages for HTTP responses

**Example**:
```typescript
export const mapUseCaseErrorToHttpError = (useCaseError: UseCaseError): HttpError => {
  switch (useCaseError._tag) {
    case "DocumentNotFound":
      return { _tag: "NotFound", message: `Document not found: ${useCaseError.documentId}` };
    case "ValidationError":
      return { _tag: "BadRequest", message: useCaseError.message };
    // ...
  }
};
```

### 6. Response Utilities (`src/utils/response.ts`)

**Purpose**: Format HTTP responses consistently

**Responsibilities**:
- Create success responses
- Create error responses
- Format response data

**Example**:
```typescript
export function successResponse<T>(data: T) {
  return { success: true, data };
}

export function errorResponse(message: string) {
  return { success: false, error: { message } };
}
```

## Data Flow

### Request Flow

```
HTTP Request
    ↓
Routes (extract params, body, query)
    ↓
Middleware (validate, authenticate)
    ↓
Controllers (map to DTOs)
    ↓
Use Cases (execute business logic)
    ↓
Controllers (map results to HTTP response)
    ↓
HTTP Response
```

### Example: Get Document by ID

1. **HTTP Request**: `GET /documents/123`
2. **Routes**: Extract `id` from params
3. **Validation**: Validate UUID format
4. **Controller**: Map to `GetDocumentQuery` DTO
5. **Use Case**: Execute `GetDocumentUseCase`
6. **Controller**: Map result to HTTP response
7. **HTTP Response**: `200 OK` with document data

## Key Principles

### 1. **Separation of Concerns**
- Presentation layer only handles HTTP concerns
- No business logic in controllers
- Controllers orchestrate use cases, not implement logic

### 2. **Request/Response Mapping**
- HTTP requests → Application DTOs (commands/queries)
- Use case results → HTTP responses
- Use case errors → HTTP errors

### 3. **Validation at Boundaries**
- Validate HTTP requests at the presentation layer
- Validate application DTOs at the application layer
- Each layer validates its own concerns

### 4. **Error Handling**
- Map application errors to HTTP errors
- Use appropriate HTTP status codes
- Provide meaningful error messages

## Current Structure

```
src/
├── routes/              # HTTP route definitions
│   ├── document.routes.ts
│   ├── auth.routes.ts
│   └── index.ts
├── controllers/         # HTTP request/response handlers
│   ├── document.controller.ts
│   ├── auth.controller.ts
│   └── use-case-error-mapper.ts
├── middleware/          # Cross-cutting concerns
│   ├── schema-validator.ts
│   └── auth.ts
├── validations/          # Request/response schemas
│   ├── document.schema.ts
│   └── auth.schema.ts
└── utils/               # HTTP utilities
    ├── response.ts
    └── http.utils.ts
```

## Integration with Application Layer

The presentation layer integrates with the application layer through:

1. **DTOs**: Controllers map HTTP requests to application DTOs
2. **Use Cases**: Controllers execute use cases with DTOs
3. **Error Mapping**: Application errors are mapped to HTTP errors
4. **Effect Layer**: Controllers provide Effect dependencies (database, etc.)

## Best Practices

1. **Keep controllers thin**: Only orchestration, no business logic
2. **Validate early**: Validate HTTP requests at the presentation layer
3. **Map explicitly**: Explicitly map between HTTP and application layers
4. **Handle errors**: Map all errors to appropriate HTTP responses
5. **Use schemas**: Define schemas for all request/response data
6. **Separate concerns**: Keep HTTP concerns separate from business logic

## Example: Complete Flow

```typescript
// 1. Route Definition
.get("/:id", async ({ params }) => {
  const validation = validateParams(documentIdParamsSchema, params);
  if (validation.error) return validation.error.body;
  return DocumentController.getDocumentById(validation.data.id);
})

// 2. Controller
static async getDocumentById(id: string) {
  const useCase = new GetDocumentUseCase();
  const query: GetDocumentQuery = { documentId: id };
  
  return Effect.runPromise(
    pipe(
      useCase.execute(query),
      Effect.provide(AppLayer),
      Effect.mapError(mapUseCaseErrorToHttpError),
      Effect.match({
        onFailure: (error) => ({ status: 404, body: errorResponse(error.message) }),
        onSuccess: (result) => ({ status: 200, body: successResponse(result) }),
      })
    )
  );
}

// 3. Use Case (Application Layer)
execute(query: GetDocumentQuery): Effect.Effect<DocumentResult, UseCaseError, DatabaseService> {
  // Business logic here
}
```

## Summary

The **Presentation Layer** is responsible for:

- ✅ **HTTP concerns**: Routes, requests, responses
- ✅ **Request validation**: Validate HTTP request data
- ✅ **DTO mapping**: Map HTTP requests to application DTOs
- ✅ **Use case orchestration**: Execute use cases
- ✅ **Response mapping**: Map use case results to HTTP responses
- ✅ **Error handling**: Map errors to HTTP errors

It should **NOT** contain:
- ❌ Business logic (that's in the application layer)
- ❌ Database queries (that's in the infrastructure layer)
- ❌ Domain logic (that's in the domain layer)
