# API Usage Guide

This guide explains how to use the APIs after the refactoring. The system now uses:
- **HTTP endpoints** for file operations (upload/download)
- **oRPC procedures** for all other operations (type-safe RPC)

## Base URL

```
http://localhost:3000
```

---

## 📁 File Operations (HTTP)

### 1. Upload Document

**Endpoint:** `POST /documents/upload`

**Content-Type:** `multipart/form-data`

**Request:**
```bash
curl -X POST http://localhost:3000/documents/upload \
  -F "file=@/path/to/document.pdf" \
  -F 'metadataTags=["invoice","2024"]'
```

**Using fetch (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('metadataTags', JSON.stringify(['invoice', '2024']));

const response = await fetch('http://localhost:3000/documents/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
```

**Response (201):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "uuid-here",
    "filename": "1234567890_document.pdf",
    "originalFilename": "document.pdf",
    "fileSize": 102400,
    "metadataTags": ["invoice", "2024"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. Download Document by Token

**Endpoint:** `GET /documents/download/:token`

**Request:**
```bash
curl -X GET http://localhost:3000/documents/download/abc123def456... \
  --output downloaded-file.pdf
```

**Using fetch (JavaScript):**
```javascript
const response = await fetch(`http://localhost:3000/documents/download/${token}`);
const blob = await response.blob();
// Create download link or save blob
```

**Response:** Binary PDF file with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="document.pdf"`

---

## 🔌 oRPC Operations (Type-Safe RPC)

All non-file operations use oRPC at `/rpc/document.{procedureName}`.

### oRPC Request Format

**Base URL:** `POST http://localhost:3000/rpc/document.{procedureName}`

**Headers:**
```
Content-Type: application/json
```

**Request Body Format:**
```json
{
  "input": {
    // Your procedure input data here
  }
}
```

---

### Available oRPC Procedures

#### 1. Create Document (Metadata Only)

**Endpoint:** `POST /rpc/document.createDocument`

**Request:**
```bash
curl -X POST http://localhost:3000/rpc/document.createDocument \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "filename": "1234567890_document.pdf",
      "originalFilename": "document.pdf",
      "metadataTags": ["invoice", "2024"]
    }
  }'
```

**Using fetch:**
```javascript
const response = await fetch('http://localhost:3000/rpc/document.createDocument', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    input: {
      filename: '1234567890_document.pdf',
      originalFilename: 'document.pdf',
      metadataTags: ['invoice', '2024']
    }
  })
});

const result = await response.json();
```

**Response:**
```json
{
  "id": "uuid-here",
  "filename": "1234567890_document.pdf",
  "originalFilename": "document.pdf",
  "fileSize": 0,
  "metadataTags": ["invoice", "2024"],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### 2. Get Document by ID

**Endpoint:** `POST /rpc/document.getDocument`

**Request:**
```bash
curl -X POST http://localhost:3000/rpc/document.getDocument \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "documentId": "uuid-here"
    }
  }'
```

**Response:**
```json
{
  "id": "uuid-here",
  "filename": "1234567890_document.pdf",
  "originalFilename": "document.pdf",
  "fileSize": 102400,
  "metadataTags": ["invoice", "2024"],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### 3. List Documents

**Endpoint:** `POST /rpc/document.listDocuments`

**Request (with pagination):**
```bash
curl -X POST http://localhost:3000/rpc/document.listDocuments \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "page": 1,
      "limit": 10
    }
  }'
```

**Request (with tags filter - search):**
```bash
curl -X POST http://localhost:3000/rpc/document.listDocuments \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "page": 1,
      "limit": 10,
      "tags": ["invoice", "2024"]
    }
  }'
```

**Request (with status filter):**
```bash
curl -X POST http://localhost:3000/rpc/document.listDocuments \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "page": 1,
      "limit": 10,
      "status": "published"
    }
  }'
```

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid-1",
      "filename": "doc1.pdf",
      "originalFilename": "document1.pdf",
      "fileSize": 102400,
      "metadataTags": ["invoice", "2024"],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "count": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### 4. Update Document Metadata

**Endpoint:** `POST /rpc/document.updateDocumentMetadata`

**Request:**
```bash
curl -X POST http://localhost:3000/rpc/document.updateDocumentMetadata \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "documentId": "uuid-here",
      "metadataTags": ["updated", "2024", "new-tag"]
    }
  }'
```

**Response:**
```json
{
  "id": "uuid-here",
  "filename": "1234567890_document.pdf",
  "originalFilename": "document.pdf",
  "fileSize": 102400,
  "metadataTags": ["updated", "2024", "new-tag"],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

#### 5. Delete Document

**Endpoint:** `POST /rpc/document.deleteDocument`

**Request:**
```bash
curl -X POST http://localhost:3000/rpc/document.deleteDocument \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "documentId": "uuid-here"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "documentId": "uuid-here"
}
```

---

#### 6. Generate Download Link

**Endpoint:** `POST /rpc/document.generateDownloadLink`

**Request:**
```bash
curl -X POST http://localhost:3000/rpc/document.generateDownloadLink \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "documentId": "uuid-here"
    }
  }'
```

**Response:**
```json
{
  "downloadUrl": "/documents/download/abc123def456...",
  "token": "abc123def456...",
  "expiresAt": "2024-01-01T15:00:00.000Z",
  "document": {
    "id": "uuid-here",
    "originalFilename": "document.pdf"
  }
}
```

**Then use the token to download:**
```bash
curl -X GET http://localhost:3000/documents/download/abc123def456... \
  --output file.pdf
```

---

#### 7. Download by Token (Get Metadata)

**Endpoint:** `POST /rpc/document.downloadByToken`

**Note:** This returns metadata about the download. Use the HTTP endpoint for actual file download.

**Request:**
```bash
curl -X POST http://localhost:3000/rpc/document.downloadByToken \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "token": "abc123def456..."
    }
  }'
```

**Response:**
```json
{
  "filePath": "./uploads/1234567890_document.pdf",
  "document": {
    "id": "uuid-here",
    "originalFilename": "document.pdf",
    "fileSize": 102400
  }
}
```

---

## 📝 Complete Workflow Examples

### Example 1: Upload and List Documents

```bash
# 1. Upload a document
curl -X POST http://localhost:3000/documents/upload \
  -F "file=@document.pdf" \
  -F 'metadataTags=["invoice","2024"]'

# Response contains document ID: "abc-123-uuid"

# 2. List all documents
curl -X POST http://localhost:3000/rpc/document.listDocuments \
  -H "Content-Type: application/json" \
  -d '{"input": {"page": 1, "limit": 10}}'

# 3. Get specific document
curl -X POST http://localhost:3000/rpc/document.getDocument \
  -H "Content-Type: application/json" \
  -d '{"input": {"documentId": "abc-123-uuid"}}'
```

### Example 2: Search and Download

```bash
# 1. Search documents by tags
curl -X POST http://localhost:3000/rpc/document.listDocuments \
  -H "Content-Type: application/json" \
  -d '{"input": {"tags": ["invoice"], "page": 1, "limit": 10}}'

# 2. Generate download link for a document
curl -X POST http://localhost:3000/rpc/document.generateDownloadLink \
  -H "Content-Type: application/json" \
  -d '{"input": {"documentId": "abc-123-uuid"}}'

# Response contains token: "xyz789..."

# 3. Download the file
curl -X GET http://localhost:3000/documents/download/xyz789... \
  --output downloaded-file.pdf
```

### Example 3: Update and Delete

```bash
# 1. Update document metadata
curl -X POST http://localhost:3000/rpc/document.updateDocumentMetadata \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "documentId": "abc-123-uuid",
      "metadataTags": ["updated", "2024"]
    }
  }'

# 2. Delete document
curl -X POST http://localhost:3000/rpc/document.deleteDocument \
  -H "Content-Type: application/json" \
  -d '{"input": {"documentId": "abc-123-uuid"}}'
```

---

## 🔧 TypeScript Client Example

```typescript
// oRPC Client Helper
async function callOrpcProcedure<T>(
  procedure: string,
  input: any
): Promise<T> {
  const response = await fetch(`http://localhost:3000/rpc/${procedure}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`oRPC error: ${error}`);
  }

  return response.json();
}

// Usage examples
const documents = await callOrpcProcedure('document.listDocuments', {
  page: 1,
  limit: 10,
  tags: ['invoice']
});

const document = await callOrpcProcedure('document.getDocument', {
  documentId: 'abc-123-uuid'
});

const downloadLink = await callOrpcProcedure('document.generateDownloadLink', {
  documentId: 'abc-123-uuid'
});
```

---

## 🚨 Error Handling

oRPC procedures return errors in the following format:

**Error Response (400/404/500):**
```json
{
  "error": {
    "message": "Document not found: abc-123-uuid"
  }
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📚 Summary

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Upload file | `POST` | `/documents/upload` |
| Download file | `GET` | `/documents/download/:token` |
| Create document | `POST` | `/rpc/document.createDocument` |
| Get document | `POST` | `/rpc/document.getDocument` |
| List documents | `POST` | `/rpc/document.listDocuments` |
| Search (by tags) | `POST` | `/rpc/document.listDocuments` (with `tags` in input) |
| Update metadata | `POST` | `/rpc/document.updateDocumentMetadata` |
| Delete document | `POST` | `/rpc/document.deleteDocument` |
| Generate download link | `POST` | `/rpc/document.generateDownloadLink` |

---

## 🎯 Quick Reference

**File Operations (HTTP):**
- Upload: `POST /documents/upload` (multipart/form-data)
- Download: `GET /documents/download/:token` (returns binary PDF)

**Data Operations (oRPC):**
- All at: `POST /rpc/document.{procedureName}`
- Request body: `{ "input": { ... } }`
- Content-Type: `application/json`
