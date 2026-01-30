# oRPC Usage Guide

## Status

✅ **oRPC is fully integrated and available in the application**

The application now supports **both HTTP (REST) and oRPC** endpoints simultaneously.

## Endpoints

### HTTP (REST) Endpoints
- Base URL: `http://localhost:3000`
- Routes: `/documents/*`, `/health`
- Format: Standard REST API

### oRPC Endpoints
- Base URL: `http://localhost:3000/rpc`
- Format: Type-safe RPC procedures

## Available oRPC Procedures

All procedures are under the `document` namespace:

1. **createDocument** - Create a document with metadata
2. **getDocument** - Get a document by ID
3. **listDocuments** - List all documents with pagination
4. **updateDocumentMetadata** - Update document metadata (tags)
5. **deleteDocument** - Delete a document
6. **generateDownloadLink** - Generate a secure download link
7. **downloadByToken** - Download document using a token

## Using oRPC Client

To use oRPC from a client, you'll need to use the `@orpc/client` package:

```typescript
import { createRouterClient } from "@orpc/client";
import type { ApiRouter } from "./path/to/orpc/router";

const client = createRouterClient<ApiRouter>({
  baseURL: "http://localhost:3000/rpc",
});

// Call procedures
const documents = await client.document.listDocuments({
  input: { page: 1, limit: 10 }
});
```

## Testing oRPC

The oRPC endpoint is integrated and ready to use. You can test it using:

1. **oRPC Client** (recommended for type safety)
2. **Direct HTTP calls** (check oRPC documentation for request format)

## Architecture

oRPC lives in the **Presentation Layer** alongside HTTP routes:
- Both use the same **Application Layer** (use cases)
- Both use the same **Domain Layer** (business logic)
- oRPC provides type-safe RPC, HTTP provides REST API

## Current Implementation

- ✅ oRPC server integrated
- ✅ All document procedures implemented
- ✅ Context extraction ready (JWT support can be added)
- ✅ Error handling mapped from use cases
- ✅ Type-safe with Effect Schema
