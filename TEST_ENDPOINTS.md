# Complete Endpoint Testing Guide

## Quick Start

1. **Start the server:**
   ```bash
   bun run start
   # or for development with hot reload:
   bun run dev
   ```

2. **Server runs on:** `http://localhost:3000`

---

## All Available Endpoints

### 1. Health Check
- **GET** `/health`
- No authentication required
- Returns server status

### 2. Document Upload
- **POST** `/documents/upload`
- Requires: PDF file (multipart/form-data)
- Optional: `metadataTags` array

### 3. Get All Documents
- **GET** `/documents`
- Returns list of all documents

### 4. Get Document by ID
- **GET** `/documents/:id`
- Requires: Document UUID

### 5. Update Document
- **PUT** `/documents/:id`
- Requires: Document UUID
- Body: `{ "metadataTags": ["tag1", "tag2"] }`

### 6. Delete Document
- **DELETE** `/documents/:id`
- Requires: Document UUID
- ⚠️ Permanently deletes document and file

### 7. Search Documents (GET)
- **GET** `/documents/search?tags=tag1&tags=tag2`
- Query parameters: `tags` (string or array)

### 8. Search Documents (POST)
- **POST** `/documents/search`
- Body: `{ "tags": ["tag1", "tag2"] }`

### 9. Generate Download Link
- **POST** `/documents/:id/download-link`
- Requires: Document UUID
- Returns: Token and download URL

### 10. Download Document by Token
- **GET** `/documents/download/:token`
- Requires: Download token from step 9
- Returns: PDF file

---

## Method 1: Using Postman (Recommended)

### Import Collection
1. Open Postman
2. Click **Import** → Select `postman_collection.json`
3. The collection includes all endpoints pre-configured

### Test Workflow
1. **Health Check** → Verify server is running
2. **Upload Document** → Get document ID
3. **Get All Documents** → Verify upload
4. **Get Document by ID** → Use ID from step 2
5. **Update Document** → Modify tags
6. **Search Documents** → Test with various tags
7. **Generate Download Link** → Get token
8. **Download Document** → Use token from step 7
9. **Delete Document** → Clean up

### Postman Environment Variables
Create an environment with:
- `baseUrl`: `http://localhost:3000`
- `documentId`: (set after upload)
- `downloadToken`: (set after generating link)

---

## Method 2: Using cURL

### Health Check
```bash
curl http://localhost:3000/health
```

### Upload Document
```bash
curl -X POST http://localhost:3000/documents/upload \
  -F "file=@/path/to/your/file.pdf" \
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
  -d '{"metadataTags":["updated","2024","revised"]}'
```

### Search Documents (GET)
```bash
curl "http://localhost:3000/documents/search?tags=invoice&tags=2024"
```

### Search Documents (POST)
```bash
curl -X POST http://localhost:3000/documents/search \
  -H "Content-Type: application/json" \
  -d '{"tags":["invoice","2024"]}'
```

### Generate Download Link
```bash
curl -X POST http://localhost:3000/documents/YOUR_DOCUMENT_ID/download-link
```

### Download Document
```bash
# Save the token from the previous response, then:
curl -O -J http://localhost:3000/documents/download/YOUR_TOKEN
```

### Delete Document
```bash
curl -X DELETE http://localhost:3000/documents/YOUR_DOCUMENT_ID
```

---

## Method 3: Using the Test Script

Run the automated test script:
```bash
bun run test:endpoints
```

Or manually:
```bash
bun test-endpoints.ts
```

---

## Expected Responses

### Success Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ ... ]
}
```

### Common Status Codes
- `200` - Success
- `201` - Created (upload, generate link)
- `400` - Bad Request (validation error)
- `404` - Not Found (document/token not found)
- `500` - Server Error

---

## Testing Checklist

- [ ] Health check returns OK
- [ ] Upload PDF file successfully
- [ ] Upload rejects non-PDF files
- [ ] Upload rejects files > 10MB
- [ ] Get all documents returns list
- [ ] Get document by ID returns correct document
- [ ] Get document by invalid ID returns 404
- [ ] Update document modifies tags
- [ ] Search by tags returns matching documents
- [ ] Search with no matches returns empty array
- [ ] Generate download link creates token
- [ ] Download with valid token returns PDF
- [ ] Download with invalid token returns 404
- [ ] Delete document removes it from database
- [ ] Delete document removes file from disk

---

## Tips

1. **Start with Health Check** - Always verify server is running first
2. **Save IDs** - After uploading, save the document ID for subsequent tests
3. **Test Error Cases** - Try invalid IDs, expired tokens, etc.
4. **Use Environment Variables** - In Postman, use variables for IDs and tokens
5. **Check File System** - Verify files are created in `./uploads` directory
6. **Check Database** - Use `sqlite3 database.sqlite` to inspect data

---

## Troubleshooting

### Server not responding
- Check if server is running: `lsof -i :3000`
- Check server logs for errors
- Verify database is initialized

### Upload fails
- Ensure file is PDF format
- Check file size < 10MB
- Verify `./uploads` directory exists and is writable

### Download fails
- Verify token is not expired (15 minutes default)
- Check token hasn't been used already
- Ensure document file still exists on disk

### Search returns no results
- Verify documents have the tags you're searching for
- Check tag spelling (case-insensitive)
- Try searching with a single tag first
