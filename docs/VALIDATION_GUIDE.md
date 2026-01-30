# Request/Response Validation Guide

## Overview

The project now has comprehensive Effect Schema-based validation for all requests and responses. This ensures type safety and consistent error handling throughout the API.

## What Was Implemented

### 1. Comprehensive Effect Schema Schemas (`src/validations/document.schema.ts`)

**Request Schemas:**
- `uploadDocumentSchema` - Validates metadata tags for uploads
- `updateDocumentSchema` - Validates metadata tags for updates
- `searchDocumentSchema` - Validates search tags (requires at least 1 tag)
- `documentIdParamsSchema` - Validates and transforms document ID params (string → number)
- `downloadTokenParamsSchema` - Validates download token params
- `searchQuerySchema` - Validates and transforms search query params (handles comma-separated tags)

**Response Schemas:**
- `documentResponseSchema` - Standard document response
- `documentListResponseSchema` - Array of documents
- `uploadDocumentResponseSchema` - Upload response
- `updateDocumentResponseSchema` - Update response
- `deleteDocumentResponseSchema` - Delete response
- `searchDocumentsResponseSchema` - Search response with count
- `downloadLinkResponseSchema` - Download link response
- `successResponseSchema<T>` - Generic success response wrapper
- `errorResponseSchema` - Error response wrapper

### 2. Validation Middleware (`src/middleware/schema-validator.ts`)

**Functions:**
- `validateParams(schema, params)` - Validates route parameters
- `validateQuery(schema, query)` - Validates query parameters
- `validateBody(schema, body)` - Validates request body
- `validateResponse(data, schema)` - Validates response data (for development/debugging)

**Features:**
- Type-safe validation with proper TypeScript narrowing
- Consistent error response format
- Returns discriminated union types for better type safety

### 3. Refactored Routes (`src/routes/document.routes.ts`)

All routes now use consistent Effect Schema validation:
- **Params validation**: All routes with `:id` or `:token` use Effect Schema schemas
- **Query validation**: Search endpoint validates query params
- **Body validation**: Update and search POST endpoints validate request bodies
- **Type transformation**: ID params are automatically converted from string to number

### 4. Response Validation (`src/controllers/document.controller.ts`)

All controller methods now validate responses before sending:
- **Inwards validation**: All incoming requests are validated (params, query, body)
- **Outwards validation**: All outgoing responses are validated against response schemas
- Ensures API contract compliance and catches bugs early

## Usage Examples

### Route with Param Validation

```typescript
.get(
  "/:id",
  async ({ params }) => {
    // Validate params
    const paramsValidation = validateParams(documentIdParamsSchema, params);
    if (paramsValidation.error) {
      return paramsValidation.error.body;
    }

    // paramsValidation.data.id is now a number (not string)
    return DocumentController.getDocumentById(paramsValidation.data.id);
  }
)
```

### Route with Body Validation

```typescript
.put(
  "/:id",
  async ({ params, body }) => {
    // Validate params
    const paramsValidation = validateParams(documentIdParamsSchema, params);
    if (paramsValidation.error) {
      return paramsValidation.error.body;
    }

    // Validate body
    const bodyValidation = validateBody(updateDocumentSchema, body);
    if (bodyValidation.error) {
      return bodyValidation.error.body;
    }

    return DocumentController.updateDocument(
      paramsValidation.data.id,
      bodyValidation.data.metadataTags
    );
  }
)
```

### Route with Query Validation

```typescript
.get(
  "/search",
  async ({ query }) => {
    // Validate query (handles comma-separated tags)
    const queryValidation = validateQuery(searchQuerySchema, query);
    if (queryValidation.error) {
      return queryValidation.error.body;
    }

    // queryValidation.data.tags is now a string array
    // Further validation for minimum tags
    const validationResult = validateBody(searchDocumentSchema, { 
      tags: queryValidation.data.tags 
    });
    if (validationResult.error) {
      return validationResult.error.body;
    }
    // ...
  }
)
```

## Benefits

1. **Type Safety**: All validated data is properly typed
2. **Consistent Validation**: All routes use the same validation pattern
3. **Automatic Transformation**: Params are automatically converted (e.g., string → number)
4. **Better Error Messages**: Effect Schema provides detailed validation error messages
5. **Response Validation**: All responses are validated against schemas before sending
6. **Effect Integration**: Built on Effect Schema for functional programming patterns
7. **Bidirectional Validation**: Both incoming requests and outgoing responses are validated

## Response Validation

Response validation is automatically applied in all controllers:

```typescript
import { validateResponse } from "../middleware/schema-validator";
import { documentResponseSchema, successResponseSchema } from "../validations/document.schema";

// In controller
const responseData = {
  id: document.id,
  filename: document.filename,
  // ... other fields
};
const validatedData = validateResponse(responseData, documentResponseSchema);
const response = successResponse(validatedData, "Success message");
return {
  status: 200,
  body: validateResponse(response, successResponseSchema(documentResponseSchema)),
};
```

This ensures that:
- Response data matches the expected schema
- API contracts are enforced
- Bugs are caught early in development
- Type safety is maintained throughout the response pipeline

