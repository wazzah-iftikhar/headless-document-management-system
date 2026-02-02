# Postman Quick Start Guide

Quick guide to test all APIs in Postman.

## 📋 Setup

1. **Import the Collection** (optional):
   - Open Postman
   - Click "Import" → Select `postman_collection.json` from project root
   - Or create requests manually using this guide

2. **Set Base URL**:
   - Create an environment variable: `baseUrl = http://localhost:3000`
   - Or use directly: `http://localhost:3000`

---

## 🏥 Health Check

**Request:**
- **Method**: `GET`
- **URL**: `http://localhost:3000/health`
- **Headers**: None needed

**Expected Response (200):**
```json
{
  "status": "ok",
  "runtime": "bun"
}
```

---

## 📁 File Operations (HTTP)

### 1. Upload Document

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:3000/documents/upload`
- **Headers**: None (Postman auto-sets `multipart/form-data`)

**Body (form-data):**
- **Key**: `file` → **Type**: `File` → **Value**: Select a PDF file
- **Key**: `metadataTags` → **Type**: `Text` → **Value**: `["invoice", "2024"]`

**Expected Response (201):**
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

**💡 Tip**: Save the `id` from the response - you'll need it for other requests!

---

### 2. Download Document by Token

**Request:**
- **Method**: `GET`
- **URL**: `http://localhost:3000/documents/download/:token`
- **Headers**: None needed

**Example**: `http://localhost:3000/documents/download/abc123def456...`

**Expected Response**: Binary PDF file download

**💡 Tip**: First generate a download token using oRPC (see below)

---

## 🔌 oRPC Operations (Type-Safe RPC)

All oRPC requests use this format:
- **Method**: `POST`
- **URL**: `http://localhost:3000/rpc/document/{procedureName}`
- **Headers**: `Content-Type: application/json`
- **Body**: JSON with `json` field containing input

---

### 1. List Documents

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:3000/rpc/document/listDocuments`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
```json
{
  "json": {
    "page": 1,
    "limit": 10
  }
}
```

**Expected Response (200):**
```json
{
  "documents": [
    {
      "id": "uuid-here",
      "filename": "1234567890_document.pdf",
      "originalFilename": "document.pdf",
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

### 2. Get Document by ID

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:3000/rpc/document/getDocument`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "json": {
    "documentId": "paste-document-id-here"
  }
}
```

**Expected Response (200):**
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

### 3. Search Documents by Tags

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:3000/rpc/document/listDocuments`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "json": {
    "page": 1,
    "limit": 10,
    "tags": ["invoice", "2024"]
  }
}
```

**Expected Response**: Same format as List Documents, but filtered by tags

---

### 4. Create Document (Metadata Only)

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:3000/rpc/document/createDocument`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "json": {
    "filename": "1234567890_document.pdf",
    "originalFilename": "document.pdf",
    "metadataTags": ["invoice", "2024"]
  }
}
```

**Expected Response (200):**
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

### 5. Update Document Metadata

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:3000/rpc/document/updateDocumentMetadata`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "json": {
    "documentId": "paste-document-id-here",
    "metadataTags": ["updated", "2024", "new-tag"]
  }
}
```

**Expected Response (200):**
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

### 6. Delete Document

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:3000/rpc/document/deleteDocument`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "json": {
    "documentId": "paste-document-id-here"
  }
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "documentId": "uuid-here"
}
```

---

### 7. Generate Download Link

**Request:**
- **Method**: `POST`
- **URL**: `http://localhost:3000/rpc/document/generateDownloadLink`
- **Headers**: `Content-Type: application/json`
- **Body (raw JSON):**
```json
{
  "json": {
    "documentId": "paste-document-id-here"
  }
}
```

**Expected Response (200):**
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

**💡 Tip**: Copy the `token` and use it in the Download Document endpoint!

---

## 🎯 Complete Workflow Example

### Step 1: Upload a Document
1. Use **Upload Document** (HTTP) to upload a PDF
2. Copy the `id` from the response

### Step 2: List All Documents
1. Use **List Documents** (oRPC) to see all documents
2. Verify your uploaded document appears

### Step 3: Get Specific Document
1. Use **Get Document by ID** (oRPC) with the `id` from Step 1

### Step 4: Update Document
1. Use **Update Document Metadata** (oRPC) to change tags

### Step 5: Generate Download Link
1. Use **Generate Download Link** (oRPC) to get a token
2. Copy the `token` from response

### Step 6: Download Document
1. Use **Download Document by Token** (HTTP) with the token from Step 5

### Step 7: Delete Document
1. Use **Delete Document** (oRPC) to remove the document

---

## 📝 Postman Collection Structure

Organize your requests like this:

```
📁 Headless Document Management System
├── 🏥 Health Check
├── 📁 File Operations (HTTP)
│   ├── Upload Document
│   └── Download Document by Token
└── 📁 oRPC Procedures
    ├── List Documents
    ├── Get Document
    ├── Search Documents (by tags)
    ├── Create Document
    ├── Update Document Metadata
    ├── Delete Document
    └── Generate Download Link
```

---

## ⚠️ Common Issues

### oRPC Returns 404
- **Check URL format**: Use `/rpc/document/listDocuments` (with slashes), not `/rpc/document.listDocuments` (with dots)
- **Check body format**: Use `{"json": {...}}` not `{"input": {...}}`

### File Upload Fails
- **Check file type**: Must be PDF (`application/pdf`)
- **Check body type**: Use `form-data`, not `raw` or `x-www-form-urlencoded`
- **Check file size**: Must be under the max file size limit

### JSON Parse Errors
- **Check Content-Type header**: Must be `application/json` for oRPC requests
- **Check JSON format**: Ensure valid JSON syntax

---

## 🔗 Related Documentation

- **[API_USAGE_GUIDE.md](./API_USAGE_GUIDE.md)** - Complete API reference
- **[POSTMAN_TESTING.md](./POSTMAN_TESTING.md)** - Detailed Postman testing guide

---

## 💡 Pro Tips

1. **Use Environment Variables**: Create a Postman environment with `baseUrl` variable
2. **Save Responses**: Use Postman's "Save Response" to test with real data
3. **Use Tests Tab**: Add assertions to verify responses automatically
4. **Use Pre-request Scripts**: Auto-generate UUIDs or timestamps
5. **Organize with Folders**: Group related requests together

---

Happy Testing! 🚀
