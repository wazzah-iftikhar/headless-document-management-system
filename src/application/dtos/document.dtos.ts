import { Schema } from "@effect/schema";
import { pipe } from "effect";

/**
 * Application Layer DTOs
 * 
 * These are application-layer contracts separate from:
 * - Domain entities (which have business rules)
 * - HTTP requests/responses (which are presentation concerns)
 * 
 * DTOs represent the input/output of use cases.
 */

// ============================================================================
// COMMAND DTOs (Write Operations)
// ============================================================================

/**
 * Create Document Command
 * Creates a document with metadata only (no file upload)
 */
export const CreateDocumentCommandSchema = Schema.Struct({
  filename: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0 && str.length <= 255,
      { message: () => "Filename must be between 1 and 255 characters" }
    )
  ),
  originalFilename: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0 && str.length <= 255,
      { message: () => "Original filename must be between 1 and 255 characters" }
    )
  ),
  metadataTags: Schema.optional(Schema.Array(Schema.String)),
});

export type CreateDocumentCommand = Schema.Schema.Type<typeof CreateDocumentCommandSchema>;

/**
 * Initiate Upload Command
 * Initiates an upload workflow and returns a pre-signed URL or upload token
 */
export const InitiateUploadCommandSchema = Schema.Struct({
  documentId: pipe(
    Schema.String,
    Schema.filter(
      (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
      { message: () => "Document ID must be a valid UUID v4" }
    )
  ),
  filename: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0 && str.length <= 255,
      { message: () => "Filename must be between 1 and 255 characters" }
    )
  ),
  fileSize: pipe(
    Schema.Number,
    Schema.filter(
      (size) => size > 0,
      { message: () => "File size must be greater than 0" }
    )
  ),
  contentType: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0,
      { message: () => "Content type is required" }
    )
  ),
});

export type InitiateUploadCommand = Schema.Schema.Type<typeof InitiateUploadCommandSchema>;

/**
 * Confirm Upload Command
 * Confirms that an upload is complete and persists the document version
 * Includes idempotency key (checksum + contentRef uniqueness)
 */
export const ConfirmUploadCommandSchema = Schema.Struct({
  documentId: pipe(
    Schema.String,
    Schema.filter(
      (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
      { message: () => "Document ID must be a valid UUID v4" }
    )
  ),
  uploadToken: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0,
      { message: () => "Upload token is required" }
    )
  ),
  checksum: pipe(
    Schema.String,
    Schema.filter(
      (str) => /^[a-f0-9]{64}$/i.test(str),
      { message: () => "Checksum must be a valid SHA-256 hash (64 hex characters)" }
    )
  ),
  filePath: pipe(
    Schema.String,
    Schema.filter(
      (str) => str.length > 0,
      { message: () => "File path is required" }
    )
  ),
  fileSize: pipe(
    Schema.Number,
    Schema.filter(
      (size) => size > 0,
      { message: () => "File size must be greater than 0" }
    )
  ),
  versionMetadata: Schema.optional(Schema.Struct({
    description: Schema.optional(Schema.String),
    tags: Schema.optional(Schema.Array(Schema.String)),
  })),
});

export type ConfirmUploadCommand = Schema.Schema.Type<typeof ConfirmUploadCommandSchema>;

/**
 * Publish Document Command
 * Changes document publish status
 */
export const PublishDocumentCommandSchema = Schema.Struct({
  documentId: pipe(
    Schema.String,
    Schema.filter(
      (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
      { message: () => "Document ID must be a valid UUID v4" }
    )
  ),
  status: pipe(
    Schema.String,
    Schema.filter(
      (str) => ["draft", "published", "archived"].includes(str),
      { message: () => "Status must be one of: draft, published, archived" }
    )
  ),
});

export type PublishDocumentCommand = Schema.Schema.Type<typeof PublishDocumentCommandSchema>;

/**
 * Update Document Metadata Command
 */
export const UpdateDocumentMetadataCommandSchema = Schema.Struct({
  documentId: pipe(
    Schema.String,
    Schema.filter(
      (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
      { message: () => "Document ID must be a valid UUID v4" }
    )
  ),
  metadataTags: Schema.optional(Schema.Array(Schema.String)),
});

export type UpdateDocumentMetadataCommand = Schema.Schema.Type<typeof UpdateDocumentMetadataCommandSchema>;

/**
 * Manage Access Policy Command
 */
export const ManageAccessPolicyCommandSchema = Schema.Struct({
  documentId: pipe(
    Schema.String,
    Schema.filter(
      (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
      { message: () => "Document ID must be a valid UUID v4" }
    )
  ),
  subjectType: pipe(
    Schema.String,
    Schema.filter(
      (str) => ["user", "role", "workspace"].includes(str),
      { message: () => "Subject type must be one of: user, role, workspace" }
    )
  ),
  subjectId: Schema.String,
  actions: Schema.Array(Schema.String),
  isActive: Schema.Boolean,
});

export type ManageAccessPolicyCommand = Schema.Schema.Type<typeof ManageAccessPolicyCommandSchema>;

// ============================================================================
// QUERY DTOs (Read Operations)
// ============================================================================

/**
 * Get Document Query
 */
export const GetDocumentQuerySchema = Schema.Struct({
  documentId: pipe(
    Schema.String,
    Schema.filter(
      (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
      { message: () => "Document ID must be a valid UUID v4" }
    )
  ),
});

export type GetDocumentQuery = Schema.Schema.Type<typeof GetDocumentQuerySchema>;

/**
 * List Documents Query
 * Supports filtering and pagination
 */
export const ListDocumentsQuerySchema = Schema.Struct({
  page: Schema.optional(pipe(
    Schema.Number,
    Schema.filter(
      (n) => n >= 1,
      { message: () => "Page must be >= 1" }
    )
  )),
  limit: Schema.optional(pipe(
    Schema.Number,
    Schema.filter(
      (n) => n >= 1 && n <= 1000,
      { message: () => "Limit must be between 1 and 1000" }
    )
  )),
  tags: Schema.optional(Schema.Array(Schema.String)),
  status: Schema.optional(pipe(
    Schema.String,
    Schema.filter(
      (str) => ["draft", "published", "archived"].includes(str),
      { message: () => "Status must be one of: draft, published, archived" }
    )
  )),
});

export type ListDocumentsQuery = Schema.Schema.Type<typeof ListDocumentsQuerySchema>;

/**
 * Check Permission Query
 */
export const CheckPermissionQuerySchema = Schema.Struct({
  userId: pipe(
    Schema.String,
    Schema.filter(
      (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
      { message: () => "User ID must be a valid UUID v4" }
    )
  ),
  documentId: pipe(
    Schema.String,
    Schema.filter(
      (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
      { message: () => "Document ID must be a valid UUID v4" }
    )
  ),
  action: pipe(
    Schema.String,
    Schema.filter(
      (str) => ["read", "write", "delete", "share", "manage"].includes(str),
      { message: () => "Action must be one of: read, write, delete, share, manage" }
    )
  ),
});

export type CheckPermissionQuery = Schema.Schema.Type<typeof CheckPermissionQuerySchema>;

// ============================================================================
// RESULT DTOs (Use Case Outputs)
// ============================================================================

/**
 * Document Result DTO
 * Represents a document in use case results
 */
export const DocumentResultSchema = Schema.Struct({
  id: Schema.String,
  filename: Schema.String,
  originalFilename: Schema.String,
  filePath: Schema.String,
  fileSize: Schema.Number,
  checksum: Schema.optional(Schema.String),
  metadataTags: Schema.Array(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export type DocumentResult = Schema.Schema.Type<typeof DocumentResultSchema>;

/**
 * Upload Initiation Result DTO
 */
export const UploadInitiationResultSchema = Schema.Struct({
  uploadToken: Schema.String,
  uploadUrl: Schema.String,
  expiresAt: Schema.String,
  documentId: Schema.String,
});

export type UploadInitiationResult = Schema.Schema.Type<typeof UploadInitiationResultSchema>;

/**
 * Upload Confirmation Result DTO
 */
export const UploadConfirmationResultSchema = Schema.Struct({
  documentId: Schema.String,
  versionNumber: Schema.Number,
  checksum: Schema.String,
  filePath: Schema.String,
});

export type UploadConfirmationResult = Schema.Schema.Type<typeof UploadConfirmationResultSchema>;

/**
 * Permission Check Result DTO
 */
export const PermissionCheckResultSchema = Schema.Struct({
  allowed: Schema.Boolean,
  reason: Schema.optional(Schema.String),
});

export type PermissionCheckResult = Schema.Schema.Type<typeof PermissionCheckResultSchema>;
