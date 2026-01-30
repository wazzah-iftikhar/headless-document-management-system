# Presentation Layer

The **Presentation Layer** is the HTTP/API layer that handles incoming HTTP requests, validates them, maps them to application layer DTOs, executes use cases, and returns HTTP responses.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  HTTP Request → Routes → Controllers → Use Cases           │
│  oRPC Request → Router → Procedures → Use Cases           │
│                                                             │
│  Components:                                                │
│  • Routes (HTTP endpoints for file operations)            │
│  • Controllers (File upload/download only)               │
│  • oRPC Router (Type-safe RPC for all other operations)   │
│  • oRPC Procedures (Type-safe request/response handlers)  │
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
  // File upload - HTTP handles multipart/form-data better
  .post("/upload", async ({ body }) => {
    const { file, metadataTags } = body;
    return DocumentController.uploadDocument(file, metadataTags);
  })
  // File download - HTTP handles binary responses with headers
  .get("/download/:token", async ({ params }) => {
    return DocumentController.downloadDocumentByToken(params.token);
  });

// Note: All other operations (get, list, update, delete, search) 
// are handled via oRPC at /rpc/document.*
```

### 2. Controllers (`src/controllers/`)

**Purpose**: Handle file operations only (upload and download)

**Responsibilities**:
- Handle file uploads via multipart/form-data
- Handle binary file downloads with proper HTTP headers
- Map file operations to use cases
- Map use case results to HTTP responses
- Handle errors and map to HTTP status codes

**Note**: All other operations (get, list, update, delete, search) are handled via oRPC procedures. Controllers are kept only for file operations because:
- File uploads work better with HTTP multipart/form-data
- Binary file downloads need proper HTTP headers (Content-Type, Content-Disposition)

**Example**:
```typescript
// src/controllers/document.controller.ts
export class DocumentController {
  /**
   * Upload Document - handles multipart/form-data file upload
   */
  static async uploadDocument(file: File, metadataTags?: string[]) {
    // Read file and create document
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const createCommand = {
      filename: `${Date.now()}_${file.name}`,
      originalFilename: file.name,
      metadataTags: metadataTags || [],
    };

    return Effect.runPromise(
      pipe(
        useCases.createDocument.execute(createCommand),
        Effect.provide(AppLayer),
        Effect.flatMap((document) =>
          Effect.tryPromise({
            try: async () => {
              const filePath = `./uploads/${document.filename}`;
              await Bun.write(filePath, buffer);
              return { document, fileSize: file.size };
            },
            catch: (error) => new Error(`Failed to save file: ${error}`),
          })
        ),
        Effect.match({
          onFailure: (httpError) => ({
            status: httpErrorToStatus(httpError),
            body: errorResponse(httpError.message),
          }),
          onSuccess: ({ document, fileSize }) => ({
            status: 201,
            body: successResponse({ ...document, fileSize }),
          }),
        })
      )
    );
  }

  /**
   * Download Document by Token - returns binary PDF with HTTP headers
   */
  static async downloadDocumentByToken(token: string) {
    return Effect.runPromise(
      pipe(
        useCases.downloadByToken.execute({ token }),
        Effect.provide(AppLayer),
        Effect.match({
          onFailure: (httpError) => new Response(
            JSON.stringify(errorResponse(httpError.message)),
            { status: httpErrorToStatus(httpError), headers: { "Content-Type": "application/json" } }
          ),
          onSuccess: (downloadData) => {
            const file = Bun.file(downloadData.filePath);
            return new Response(file, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${downloadData.document.originalFilename}"`,
              },
            });
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

### Example: Upload Document (HTTP)

1. **HTTP Request**: `POST /documents/upload` (multipart/form-data)
2. **Routes**: Extract `file` and `metadataTags` from body
3. **Validation**: Validate file type and metadata tags
4. **Controller**: Read file, create document, save file to disk
5. **Use Case**: Execute `CreateDocumentUseCase`
6. **Controller**: Map result to HTTP response
7. **HTTP Response**: `201 Created` with document data

### Example: Get Document by ID (oRPC)

1. **oRPC Request**: `POST /rpc/document.getDocument` with `{ documentId: "123" }`
2. **oRPC Router**: Routes to `document.getDocument` procedure
3. **Procedure**: Validates input schema, extracts context
4. **Use Case**: Execute `GetDocumentUseCase`
5. **Procedure**: Returns result directly (type-safe)
6. **oRPC Response**: JSON with document data

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

### HTTP File Upload Flow

```typescript
// 1. Route Definition
.post("/upload", async ({ body }) => {
  const { file, metadataTags } = body;
  return DocumentController.uploadDocument(file, metadataTags);
})

// 2. Controller (File Operation)
static async uploadDocument(file: File, metadataTags?: string[]) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const createCommand = {
    filename: `${Date.now()}_${file.name}`,
    originalFilename: file.name,
    metadataTags: metadataTags || [],
  };
  
  return Effect.runPromise(
    pipe(
      useCases.createDocument.execute(createCommand),
      Effect.provide(AppLayer),
      Effect.flatMap((document) =>
        Effect.tryPromise({
          try: async () => {
            await Bun.write(`./uploads/${document.filename}`, buffer);
            return { document, fileSize: file.size };
          },
          catch: (error) => new Error(`Failed to save file: ${error}`),
        })
      ),
      Effect.match({
        onFailure: (error) => ({ status: 500, body: errorResponse(error.message) }),
        onSuccess: ({ document, fileSize }) => ({ status: 201, body: successResponse({ ...document, fileSize }) }),
      })
    )
  );
}

// 3. Use Case (Application Layer)
execute(command: CreateDocumentCommand): Effect.Effect<DocumentResult, UseCaseError, DatabaseService> {
  // Business logic here
}
```

### oRPC Get Document Flow

```typescript
// 1. oRPC Procedure Definition
export const getDocument = os
  .input(GetDocumentQuerySchema)
  .output(DocumentResultSchema)
  .handler(async ({ input, context }) => {
    return Effect.runPromise(
      pipe(
        useCases.getDocument.execute(input),
        Effect.provide(AppLayer),
        Effect.mapError((error) => new Error(error.message))
      )
    );
  });

// 2. Use Case (Application Layer) - same as above
execute(query: GetDocumentQuery): Effect.Effect<DocumentResult, UseCaseError, DatabaseService> {
  // Business logic here
}
```

## Summary

The **Presentation Layer** is responsible for:

- ✅ **HTTP concerns**: Routes for file operations (upload/download)
- ✅ **oRPC concerns**: Type-safe RPC procedures for all other operations
- ✅ **Request validation**: Validate HTTP and oRPC request data
- ✅ **DTO mapping**: Map HTTP/oRPC requests to application DTOs
- ✅ **Use case orchestration**: Execute use cases
- ✅ **Response mapping**: Map use case results to HTTP/oRPC responses
- ✅ **Error handling**: Map errors to HTTP/oRPC errors

It should **NOT** contain:
- ❌ Business logic (that's in the application layer)
- ❌ Database queries (that's in the infrastructure layer)
- ❌ Domain logic (that's in the domain layer)
