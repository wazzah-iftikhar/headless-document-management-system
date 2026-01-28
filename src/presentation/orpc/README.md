# oRPC Procedures for Document Management

This directory contains oRPC procedures that provide type-safe RPC endpoints for document management operations.

## Structure

- `document.procedures.ts` - Document management and query procedures
- `schema-adapter.ts` - Effect Schema to oRPC adapter for type safety
- `context-extractor.ts` - JWT token extraction and workspace context handling

## Context Extraction

All procedures extract workspace and user context from JWT tokens in request headers:

```typescript
// JWT token structure expected:
{
  userId: string;
  workspaceId: string;
  email?: string;
  role?: string;
  iat: number;
  exp: number;
}
```

### Header Format

```
Authorization: Bearer <jwt-token>
```

or

```
X-Authorization: Bearer <jwt-token>
```

### Context Usage

The extracted context (`RequestContext`) contains:
- `userId` - User ID from JWT
- `workspaceId` - Workspace ID for multi-tenancy
- `email` - User email (optional)
- `role` - User role (optional)

### Future Integration

When use cases are updated to accept context, procedures will pass it:

```typescript
// Future implementation:
const useCase = new CreateDocumentUseCase();
const result = await executeUseCase(useCase.execute(validatedInput, ctx));
```

## Type Safety

All procedures use Effect Schema DTOs directly for:
- Input validation
- Output validation
- Type inference

This ensures end-to-end type safety from client to use cases.

## Error Handling

Errors from use cases are mapped to oRPC error format:
- `DocumentNotFound` → `NOT_FOUND`
- `ValidationError` → `BAD_REQUEST`
- `PermissionDenied` → `UNAUTHORIZED`
- `DuplicateUpload` → `CONFLICT`
- etc.
