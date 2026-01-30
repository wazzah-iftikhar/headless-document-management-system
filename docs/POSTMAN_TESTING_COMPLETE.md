# Postman Testing Guide - Complete API Testing

## Quick Start

1. **Start the server:**
   ```bash
   bun run dev
   ```
   Server runs on `http://localhost:3000`

2. **Import Postman Collection:**
   - Open Postman
   - Click "Import" → Select `postman_collection.json`
   - Or manually create requests using the guide below

## Testing Workflow

### Step 1: Health Check
**GET** `http://localhost:3000/health`

Expected Response:
```json
{
  "status": "ok",
  "runtime": "bun"
}
```

### Step 2: Upload a Document
**POST** `http://localhost:3000/documents/upload`

**Postman Setup:**
1. Method: `POST`
2. URL: `http://localhost:3000/documents/upload`
3. Body → form-data:
   - `file` (File): Select a PDF file
   - `metadataTags` (Text): `["invoice", "2024"]` (optional)

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "uuid-here",
    "filename": "generated-filename.pdf",
    "originalFilename": "your-file.pdf",
    "fileSize": 102400,
    "metadataTags": ["invoice", "2024"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Save the `id` from the response for next steps!**

### Step 3: Get All Documents
**GET** `http://localhost:3000/documents`

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Documents retrieved successfully",
  "data": {
    "documents": [
      {
        "id": "uuid",
        "filename": "...",
        "originalFilename": "...",
        "fileSize": 102400,
        "metadataTags": ["invoice", "2024"],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "count": 1
  }
}
```

### Step 4: Get Document by ID
**GET** `http://localhost:3000/documents/{id}`

Replace `{id}` with the document ID from Step 2.

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Document retrieved successfully",
  "data": {
    "id": "uuid",
    "filename": "...",
    "originalFilename": "...",
    "fileSize": 102400,
    "metadataTags": ["invoice", "2024"],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Step 5: Update Document
**PUT** `http://localhost:3000/documents/{id}`

**Body (JSON):**
```json
{
  "metadataTags": ["updated", "2024", "revised"]
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "id": "uuid",
    "filename": "...",
    "metadataTags": ["updated", "2024", "revised"],
    "updatedAt": "2024-01-01T01:00:00.000Z"
  }
}
```

### Step 6: Search Documents by Tags
**GET** `http://localhost:3000/documents/search?tags=invoice&tags=2024`

**OR**

**POST** `http://localhost:3000/documents/search`

**Body (JSON):**
```json
{
  "tags": ["invoice", "2024"]
}
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Found 1 document(s) matching the search criteria",
  "data": {
    "documents": [...],
    "count": 1,
    "searchTags": ["invoice", "2024"]
  }
}
```

### Step 7: Generate Download Link
**POST** `http://localhost:3000/documents/{id}/download-link`

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Download link generated successfully",
  "data": {
    "token": "64-character-hex-token",
    "expiresAt": "2024-01-01T00:15:00.000Z",
    "downloadUrl": "/documents/download/64-character-hex-token",
    "document": {...}
  }
}
```

**Save the `token` for the next step!**

### Step 8: Download Document
**GET** `http://localhost:3000/documents/download/{token}`

Replace `{token}` with the token from Step 7.

**Expected Response:**
- Status: `200 OK`
- Content-Type: `application/pdf`
- Body: PDF file (binary)

**In Postman:**
- Click "Send and Download" to save the file
- Or use "Send" and view the binary response

### Step 9: Delete Document
**DELETE** `http://localhost:3000/documents/{id}`

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "id": "uuid",
    "filename": "...",
    "deletedAt": "2024-01-01T02:00:00.000Z"
  }
}
```

## Error Testing

### Test Invalid File Type
**POST** `/documents/upload`
- Upload a non-PDF file (e.g., .txt, .jpg)
- Expected: `400 Bad Request` with message "Only PDF files are allowed"

### Test File Too Large
**POST** `/documents/upload`
- Upload a PDF > 10MB
- Expected: `400 Bad Request` with message about file size

### Test Document Not Found
**GET** `/documents/invalid-uuid`
- Expected: `404 Not Found` with message "Document not found"

### Test Invalid Token
**GET** `/documents/download/invalid-token`
- Expected: `404 Not Found` with message "Invalid or expired download link"

## Testing Tips

1. **Use Environment Variables in Postman:**
   - Create an environment with `baseUrl = http://localhost:3000`
   - Create variable `documentId` and set it after uploading
   - Create variable `downloadToken` and set it after generating link

2. **Test Sequence:**
   ```
   Upload → Get All → Get by ID → Update → Search → Generate Link → Download → Delete
   ```

3. **Multiple Documents:**
   - Upload several documents with different tags
   - Test search with various tag combinations
   - Verify pagination (if implemented in future)

4. **Performance Testing:**
   - Upload multiple documents
   - Test search performance with many documents
   - Monitor response times

## cURL Examples

### Upload Document
```bash
curl -X POST http://localhost:3000/documents/upload \
  -F "file=@/path/to/file.pdf" \
  -F 'metadataTags=["invoice","2024"]'
```

### Get All Documents
```bash
curl http://localhost:3000/documents
```

### Get Document by ID
```bash
curl http://localhost:3000/documents/YOUR_DOCUMENT_ID
```

### Update Document
```bash
curl -X PUT http://localhost:3000/documents/YOUR_DOCUMENT_ID \
  -H "Content-Type: application/json" \
  -d '{"metadataTags":["updated","2024"]}'
```

### Search Documents
```bash
curl "http://localhost:3000/documents/search?tags=invoice&tags=2024"
```

### Generate Download Link
```bash
curl -X POST http://localhost:3000/documents/YOUR_DOCUMENT_ID/download-link
```

### Download Document
```bash
curl -O -J http://localhost:3000/documents/download/YOUR_TOKEN
```

## Notes

- **Document IDs**: The new repository system uses UUIDs (v4) instead of integers
- **Pagination**: Currently not exposed via API, but implemented in repositories
- **New Repositories**: The new repository implementations are ready but not yet integrated into the service layer
- **Database**: Uses SQLite (`database.sqlite` file) by default

## Next Steps (Future Integration)

To test the new repository features (pagination, etc.), you would need to:
1. Update `DocumentService` to use `DocumentRepositoryImpl` instead of `DocumentRepository`
2. Add pagination query parameters to routes (`?page=1&limit=10`)
3. Add endpoints for User and AccessPolicy management

For now, the existing endpoints work and test the core functionality!
