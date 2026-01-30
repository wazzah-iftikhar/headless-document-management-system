# Controllers vs oRPC: Should They Coexist?

## Direct Answer

### ✅ **Keep Controllers IF you need:**
1. **File Uploads** (`multipart/form-data`) - HTTP handles this better
2. **File Downloads** (binary responses with headers) - HTTP is simpler
3. **Public API** - REST is more standard for external consumers
4. **Backward Compatibility** - Existing HTTP clients

### ❌ **Remove Controllers IF:**
1. **No file operations** - All operations are JSON/data only
2. **Internal services only** - No public API needed
3. **All clients can use oRPC** - Type-safe clients available
4. **Want simpler codebase** - Single API surface

## Current Situation Analysis

### What HTTP Controllers Do (that oRPC doesn't):

1. **File Upload** (`uploadDocument`)
   - Handles `multipart/form-data`
   - Processes `File` objects from HTTP requests
   - ❌ oRPC doesn't have this implemented

2. **File Download** (`downloadDocumentByToken`)
   - Returns binary PDF with proper HTTP headers
   - Sets `Content-Disposition`, `Content-Type`, `Content-Length`
   - ❌ oRPC procedure returns metadata only (comment says "use HTTP endpoint")

3. **Search Endpoints**
   - Both GET (query params) and POST (body) variants
   - HTTP-specific routing

### What oRPC Procedures Do:
- ✅ All CRUD operations (create, read, update, delete)
- ✅ Type-safe end-to-end
- ✅ Better for internal services
- ❌ No file upload
- ❌ No binary file download

## Recommendation

### **Option 1: Keep Both (Hybrid Approach)** ⭐ Recommended

**Keep controllers for:**
- File uploads (`/documents/upload`)
- File downloads (`/documents/download/:token`)

**Use oRPC for:**
- All other operations (CRUD, queries)

**Why:**
- Best of both worlds
- File operations work better with HTTP
- Type-safe operations with oRPC
- Minimal duplication (only file operations in controllers)

### **Option 2: oRPC Only** (If you can handle files differently)

**Remove controllers IF:**
- You implement file upload in oRPC (using base64 or separate upload service)
- You keep HTTP endpoint only for file downloads
- All other operations use oRPC

**Why:**
- Simpler codebase
- Single API surface
- More type-safe

### **Option 3: HTTP Only** (If oRPC isn't needed)

**Remove oRPC IF:**
- No type-safe clients needed
- Public API only
- Standard REST is sufficient

## My Recommendation for Your Codebase

### ✅ **Keep Both, But Minimize Controllers**

**Keep controllers for:**
```typescript
// Only these need controllers:
- uploadDocument (file upload)
- downloadDocumentByToken (binary file download)
```

**Use oRPC for:**
```typescript
// All these can use oRPC:
- createDocument
- getDocument
- listDocuments
- updateDocumentMetadata
- deleteDocument
- generateDownloadLink
```

**Result:**
- Controllers handle file operations (HTTP-specific)
- oRPC handles data operations (type-safe)
- Minimal code duplication
- Best of both worlds

## Implementation Strategy

### Current State:
- ✅ Both exist
- ✅ Both work
- ✅ Both use same use cases

### Optimized State:
1. Keep HTTP routes for file operations only
2. Move all other operations to oRPC
3. Deprecate HTTP routes for non-file operations
4. Eventually remove those controllers

## Conclusion

**Answer: They CAN coexist, but you should minimize overlap.**

**Best Practice:**
- **File operations** → HTTP Controllers
- **Data operations** → oRPC Procedures
- **Both use same use cases** → No business logic duplication

This gives you:
- ✅ File uploads/downloads (HTTP)
- ✅ Type-safe operations (oRPC)
- ✅ Minimal code duplication
- ✅ Flexibility
