import { Schema } from "@effect/schema";
import { pipe } from "effect";

// Request Schemas
export const uploadDocumentSchema = Schema.Struct({
  metadataTags: Schema.optional(Schema.Array(Schema.String)),
});

export const updateDocumentSchema = Schema.Struct({
  metadataTags: Schema.optional(Schema.Array(Schema.String)),
});

export const searchDocumentSchema = Schema.Struct({
  tags: pipe(
    Schema.Array(Schema.String),
    Schema.filter((arr) => arr.length >= 1, { message: () => "At least one tag is required for search" })
  ),
});

// Helper to transform string to number for ID
const stringToNumber = pipe(
  Schema.String,
  Schema.filter(
    (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
    { message: () => "ID must be a valid UUID v4" }
  )
);

export const documentIdParamsSchema = Schema.Struct({
  id: uuidSchema,
});

export const downloadTokenParamsSchema = Schema.Struct({
  token: pipe(
    Schema.String,
    Schema.filter((str) => str.length >= 1, { message: () => "Token is required" })
  ),
});

// Helper to transform query tags
const queryTagsTransform = pipe(
  Schema.Union(Schema.String, Schema.Array(Schema.String)),
  Schema.transform(Schema.Array(Schema.String), {
    decode: (val) => {
      if (typeof val === "string") {
        return val.split(",").map((tag) => tag.trim()).filter(Boolean);
      }
      return val.flatMap((t) =>
        typeof t === "string" ? t.split(",").map((tag) => tag.trim()) : []
      );
    },
    encode: (arr) => arr, // reverse transform (not used in practice)
  })
);

export const searchQuerySchema = Schema.Struct({
  tags: queryTagsTransform,
});

// Response Schemas
export const documentResponseSchema = Schema.Struct({
  id: Schema.String, // UUID string
  filename: Schema.String,
  originalFilename: Schema.String,
  fileSize: Schema.Number,
  metadataTags: Schema.Array(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
});

export const documentListResponseSchema = Schema.Array(documentResponseSchema);

export const uploadDocumentResponseSchema = Schema.Struct({
  id: Schema.String, // UUID string
  filename: Schema.String,
  originalFilename: Schema.String,
  fileSize: Schema.Number,
  metadataTags: Schema.Array(Schema.String),
  createdAt: Schema.String,
});

export const updateDocumentResponseSchema = documentResponseSchema;

export const deleteDocumentResponseSchema = Schema.Struct({
  id: Schema.String, // UUID string
  filename: Schema.String,
});

export const searchDocumentsResponseSchema = Schema.Struct({
  documents: documentListResponseSchema,
  count: Schema.Number,
  searchTags: Schema.Array(Schema.String),
});

export const downloadLinkResponseSchema = Schema.Struct({
  downloadUrl: Schema.String,
  token: Schema.String,
  expiresAt: Schema.String,
  expiresInMinutes: Schema.Number,
  documentId: Schema.String, // UUID string
  originalFilename: Schema.String,
});

// Standard API Response Wrapper
export const successResponseSchema = <A, I>(dataSchema: Schema.Schema<A, I>) =>
  Schema.Struct({
    success: Schema.Literal(true),
    message: Schema.optional(Schema.String),
    data: dataSchema,
  });

export const errorResponseSchema = Schema.Struct({
  success: Schema.Literal(false),
  message: Schema.String,
  errors: Schema.optional(Schema.Unknown),
});

// Type exports
export type DocumentResponse = Schema.Schema.Type<typeof documentResponseSchema>;
export type UploadDocumentResponse = Schema.Schema.Type<typeof uploadDocumentResponseSchema>;
export type UpdateDocumentResponse = Schema.Schema.Type<typeof updateDocumentResponseSchema>;
export type DeleteDocumentResponse = Schema.Schema.Type<typeof deleteDocumentResponseSchema>;
export type SearchDocumentsResponse = Schema.Schema.Type<typeof searchDocumentsResponseSchema>;
export type DownloadLinkResponse = Schema.Schema.Type<typeof downloadLinkResponseSchema>;
