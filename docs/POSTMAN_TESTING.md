# Postman Testing Guide

## Server Information
- **Base URL**: `http://localhost:3000`
- **Health Check**: `GET http://localhost:3000/health`

## Upload Document API

### Endpoint
```
POST http://localhost:3000/documents/upload
```

### Postman Setup Steps

1. **Create a new request in Postman**
   - Method: `POST`
   - URL: `http://localhost:3000/documents/upload`

2. **Set Headers**
   - Go to the "Headers" tab
   - Postman will automatically set `Content-Type: multipart/form-data` when you add form data

3. **Set Body**
   - Go to the "Body" tab
   - Select `form-data` (NOT raw or x-www-form-urlencoded)
   - Add the following fields:

   **Field 1: File Upload**
   - Key: `file` (make sure the type is "File" - you'll see a dropdown)
   - Value: Click "Select Files" and choose a PDF file

   **Field 2: Metadata Tags (Optional)**
   - Key: `metadataTags` (type should be "Text")
   - Value: `["invoice", "2024", "financial"]` (JSON array as string)
   
   **OR** if Postman supports array input:
   - Key: `metadataTags[0]` → Value: `invoice`
   - Key: `metadataTags[1]` → Value: `2024`
   - Key: `metadataTags[2]` → Value: `financial`

4. **Send Request**
   - Click "Send"
   - You should receive a response with status 201 and document details

### Expected Success Response (201)
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": 1,
    "filename": "1234567890_invoice.pdf",
    "originalFilename": "invoice.pdf",
    "fileSize": 102400,
    "metadataTags": ["invoice", "2024", "financial"],
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Expected Error Responses

**400 - Invalid File Type**
```json
{
  "success": false,
  "message": "Only PDF files are allowed"
}
```

**400 - File Too Large**
```json
{
  "success": false,
  "message": "File size exceeds maximum allowed size of 10MB"
}
```

## Alternative: Using cURL

If you prefer command line testing:

```bash
curl -X POST http://localhost:3000/documents/upload \
  -F "file=@/path/to/your/file.pdf" \
  -F 'metadataTags=["invoice","2024"]'
```

## Read APIs - Testing Guide

### 1. Get All Documents

**Endpoint:**
```
GET http://localhost:3000/documents
```

**Postman Setup:**
1. Create a new request
2. Method: `GET`
3. URL: `http://localhost:3000/documents`
4. No headers or body needed
5. Click "Send"

**Expected Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "filename": "1234567890_invoice.pdf",
      "originalFilename": "invoice.pdf",
      "fileSize": 102400,
      "metadataTags": ["invoice", "2024", "financial"],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "filename": "1234567891_report.pdf",
      "originalFilename": "report.pdf",
      "fileSize": 204800,
      "metadataTags": ["report", "monthly"],
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

**Empty Response (if no documents):**
```json
{
  "success": true,
  "data": []
}
```

---

### 2. Get Document by ID

**Endpoint:**
```
GET http://localhost:3000/documents/:id
```

**Postman Setup:**
1. Create a new request
2. Method: `GET`
3. URL: `http://localhost:3000/documents/1` (replace `1` with actual document ID)
4. No headers or body needed
5. Click "Send"

**Expected Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "1234567890_invoice.pdf",
    "originalFilename": "invoice.pdf",
    "fileSize": 102400,
    "metadataTags": ["invoice", "2024", "financial"],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404 - Document not found):**
```json
{
  "success": false,
  "message": "Document not found"
}
```

**Error Response (400 - Invalid ID):**
```json
{
  "success": false,
  "message": "Invalid document ID"
}
```

---

### Testing Steps:

1. **First, upload a document** (if you haven't already)
   - Use the upload endpoint to create at least one document
   - Note the `id` from the response

2. **Test Get All Documents**
   - Should return all uploaded documents

3. **Test Get Document by ID**
   - Use the `id` from step 1
   - Try with an invalid ID (e.g., 999) to test error handling

---

## Update Document API - Testing Guide

### Endpoint
```
PUT http://localhost:3000/documents/:id
```

### Postman Setup Steps

1. **Create a new request**
   - Method: `PUT`
   - URL: `http://localhost:3000/documents/1` (replace `1` with the document ID you want to update)

2. **Set Headers**
   - Go to the "Headers" tab
   - Add: `Content-Type: application/json`

3. **Set Body**
   - Go to the "Body" tab
   - Select `raw`
   - Choose `JSON` from the dropdown
   - Enter the request body:

   **Example 1: Update with new tags**
   ```json
   {
     "metadataTags": ["updated", "2024", "new-tag"]
   }
   ```

   **Example 2: Clear tags (empty array)**
   ```json
   {
     "metadataTags": []
   }
   ```

   **Note:** The `metadataTags` field is optional. If you omit it, the tags won't be updated.

4. **Send Request**
   - Click "Send"

### Expected Success Response (200)
```json
{
  "success": true,
  "message": "Document updated successfully",
  "data": {
    "id": 1,
    "filename": "1767105967020_a.pdf",
    "originalFilename": "a.pdf",
    "fileSize": 41341,
    "metadataTags": ["updated", "2024", "new-tag"],
    "createdAt": "2025-12-30 14:46:07",
    "updatedAt": "2025-12-30 14:50:00"
  }
}
```

### Error Responses

**404 - Document not found**
```json
{
  "success": false,
  "message": "Document not found"
}
```

**400 - Invalid document ID**
```json
{
  "success": false,
  "message": "Invalid document ID"
}
```

**400 - Validation error (invalid tags format)**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [...]
}
```

### Testing Steps:

1. **Get current document** (to see current tags)
   - `GET http://localhost:3000/documents/1`
   - Note the current `metadataTags`

2. **Update the document**
   - `PUT http://localhost:3000/documents/1`
   - Send new tags in the body

3. **Verify the update**
   - `GET http://localhost:3000/documents/1`
   - Check that `metadataTags` and `updatedAt` have changed

### cURL Example
```bash
curl -X PUT http://localhost:3000/documents/1 \
  -H "Content-Type: application/json" \
  -d '{"metadataTags": ["updated", "2024", "new-tag"]}'
```

---

## Delete Document API - Testing Guide

### Endpoint
```
DELETE http://localhost:3000/documents/:id
```

### Postman Setup Steps

1. **Create a new request**
   - Method: `DELETE`
   - URL: `http://localhost:3000/documents/5` (replace `5` with the document ID you want to delete)
   - **⚠️ WARNING: This will permanently delete the document and its file!**

2. **No Headers or Body needed**
   - DELETE requests don't require headers or body
   - Just set the URL with the document ID

3. **Send Request**
   - Click "Send"

### Expected Success Response (200)
```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": {
    "id": 5,
    "filename": "1767106228141_e.pdf"
  }
}
```

### Error Responses

**404 - Document not found**
```json
{
  "success": false,
  "message": "Document not found"
}
```

**400 - Invalid document ID**
```json
{
  "success": false,
  "message": "Invalid document ID"
}
```

### Testing Steps:

1. **Before deletion - Verify document exists**
   - `GET http://localhost:3000/documents/5`
   - Should return the document details

2. **Delete the document**
   - `DELETE http://localhost:3000/documents/5`
   - Should return success message

3. **Verify deletion**
   - `GET http://localhost:3000/documents/5`
   - Should return 404 "Document not found"
   - `GET http://localhost:3000/documents`
   - The deleted document should no longer appear in the list

### cURL Example
```bash
# Delete document with ID 5
curl -X DELETE http://localhost:3000/documents/5
```

### Important Notes:
- ⚠️ **Deletion is permanent** - The document and its PDF file will be permanently removed
- The delete operation removes both:
  - The database record
  - The physical PDF file from the uploads directory
- Make sure you have the correct document ID before deleting

---

## Search Documents API - Testing Guide

### Endpoint 1: GET Search (Query Parameters)
```
GET http://localhost:3000/documents/search?tags=tag1,tag2
```

### Endpoint 2: POST Search (Request Body)
```
POST http://localhost:3000/documents/search
```

### Postman Setup for GET Search

1. **Create a new request**
   - Method: `GET`
   - URL: `http://localhost:3000/documents/search?tags=2024`
   - Or with multiple tags: `http://localhost:3000/documents/search?tags=product,2022`

2. **Query Parameters**
   - Go to the "Params" tab
   - Add parameter:
     - Key: `tags`
     - Value: `2024` (single tag) or `product,2022` (multiple tags, comma-separated)

3. **No Headers or Body needed**
   - Just set the URL with query parameters

4. **Send Request**
   - Click "Send"

### Postman Setup for POST Search

1. **Create a new request**
   - Method: `POST`
   - URL: `http://localhost:3000/documents/search`

2. **Set Headers**
   - Go to the "Headers" tab
   - Add: `Content-Type: application/json`

3. **Set Body**
   - Go to the "Body" tab
   - Select `raw`
   - Choose `JSON` from the dropdown
   - Enter:
   ```json
   {
     "tags": ["qa", "2023"]
   }
   ```

4. **Send Request**
   - Click "Send"

### Expected Success Response (200)
```json
{
  "success": true,
  "message": "Found 2 document(s) matching the search criteria",
  "data": {
    "documents": [
      {
        "id": 1,
        "filename": "1767105967020_a.pdf",
        "originalFilename": "a.pdf",
        "fileSize": 41341,
        "metadataTags": ["updated", "2024", "test"],
        "createdAt": "2025-12-30 14:46:07",
        "updatedAt": "2025-12-30T14:54:01.802Z"
      },
      {
        "id": 4,
        "filename": "...",
        "originalFilename": "...",
        "fileSize": 41341,
        "metadataTags": ["marketing", "2024"],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "count": 2,
    "searchTags": ["2024"]
  }
}
```

### Error Responses

**400 - No tags provided**
```json
{
  "success": false,
  "message": "At least one tag is required for search",
  "errors": [...]
}
```

**400 - Validation error**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [...]
}
```

### Search Features

- **Case-insensitive**: Searches are case-insensitive
- **Partial matching**: Finds documents where tags contain the search term
- **Multiple tags**: Returns documents that have ANY of the specified tags (OR logic)
- **Empty results**: Returns empty array if no documents match

### Test Scenarios

1. **Single tag search:**
   - `GET /documents/search?tags=2024`
   - Should return documents with "2024" tag

2. **Multiple tags (comma-separated):**
   - `GET /documents/search?tags=product,2022`
   - Should return documents with either "product" OR "2022" tags

3. **POST search with array:**
   - `POST /documents/search` with body: `{"tags": ["qa", "2023"]}`
   - Should return documents with either "qa" OR "2023" tags

4. **No results:**
   - `GET /documents/search?tags=nonexistent`
   - Should return empty array with count: 0

5. **Error - no tags:**
   - `GET /documents/search` (no query params)
   - Should return 400 error

### Current Available Tags in Your Database:
Based on your documents, you can test with:
- `2024`, `2022`, `2023`, `2025`
- `updated`, `test`
- `product`
- `qa`
- `marketing`
- `support`

### cURL Examples

**GET Search:**
```bash
# Single tag
curl "http://localhost:3000/documents/search?tags=2024"

# Multiple tags
curl "http://localhost:3000/documents/search?tags=product,2022"
```

**POST Search:**
```bash
curl -X POST http://localhost:3000/documents/search \
  -H "Content-Type: application/json" \
  -d '{"tags": ["qa", "2023"]}'
```

---

## Download Link API - Testing Guide

The download link feature has **two endpoints** that work together:

1. **Generate Download Link** - Creates a short-lived token
2. **Download File** - Uses the token to download the file

---

### Step 1: Generate Download Link

**Endpoint:**
```
POST http://localhost:3000/documents/:id/download-link
```

**Postman Setup:**

1. **Create a new request**
   - Method: `POST`
   - URL: `http://localhost:3000/documents/1/download-link` (replace `1` with document ID)

2. **No Headers or Body needed**
   - Just set the URL with the document ID

3. **Send Request**
   - Click "Send"

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "Download link generated successfully",
  "data": {
    "downloadUrl": "/documents/download/abc123def456...",
    "token": "abc123def456...",
    "expiresAt": "2025-12-30T15:15:00.000Z",
    "expiresInMinutes": 15,
    "documentId": 1,
    "originalFilename": "a.pdf"
  }
}
```

**Error Responses:**

**404 - Document not found**
```json
{
  "success": false,
  "message": "Document not found"
}
```

**400 - Invalid document ID**
```json
{
  "success": false,
  "message": "Invalid document ID"
}
```

---

### Step 2: Download File Using Token

**Endpoint:**
```
GET http://localhost:3000/documents/download/:token
```

**Postman Setup:**

1. **Create a new request**
   - Method: `GET`
   - URL: `http://localhost:3000/documents/download/{token}`
   - Replace `{token}` with the token from Step 1

2. **No Headers or Body needed**

3. **Important: Save Response**
   - In Postman, click "Send and Download" or "Save Response"
   - The PDF file will be downloaded

**Expected Response:**
- Status: `200 OK`
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="a.pdf"`
- The response body will be the PDF file (binary data)

**Error Responses:**

**404 - Invalid or expired token**
```json
{
  "success": false,
  "message": "Invalid or expired download link"
}
```

**404 - Document not found**
```json
{
  "success": false,
  "message": "Document not found"
}
```

---

### Complete Testing Workflow

1. **Generate Download Link**
   - `POST /documents/1/download-link`
   - Copy the `token` from the response

2. **Download the File**
   - `GET /documents/download/{token}`
   - Use the token from step 1
   - The PDF should download

3. **Test Expiration (Optional)**
   - Wait 15+ minutes (or change expiry time)
   - Try to download again
   - Should return 404 "Invalid or expired download link"

---

### Features

- **Short-lived links**: Default expiration is 15 minutes (configurable)
- **Secure tokens**: 64-character hex tokens
- **One-time use**: Token is marked as used after download (optional)
- **Automatic cleanup**: Expired tokens are invalid

### Configuration

The expiration time can be configured via environment variable:
```bash
DOWNLOAD_LINK_EXPIRY_MINUTES=30  # 30 minutes instead of default 15
```

### cURL Examples

**Generate Download Link:**
```bash
curl -X POST http://localhost:3000/documents/1/download-link
```

**Download File:**
```bash
# First, get the token from the generate response
TOKEN="your-token-here"

# Then download
curl -O -J "http://localhost:3000/documents/download/$TOKEN"
```

**Or in one command:**
```bash
# Generate and download in one go
TOKEN=$(curl -s -X POST http://localhost:3000/documents/1/download-link | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
curl -O -J "http://localhost:3000/documents/download/$TOKEN"
```

---

## Other Endpoints to Test

### Search Documents
```
GET http://localhost:3000/documents/search?tags=invoice,2024
```

### Generate Download Link
```
POST http://localhost:3000/documents/1/download-link
```

### Download File
```
GET http://localhost:3000/documents/download/{token}
```

