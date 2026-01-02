import { z } from "zod";

// Request Schemas
export const uploadDocumentSchema = z.object({
  metadataTags: z.array(z.string()).optional().default([]),
});

export const updateDocumentSchema = z.object({
  metadataTags: z.array(z.string()).optional(),
});

export const searchDocumentSchema = z.object({
  tags: z.array(z.string()).min(1, "At least one tag is required for search"),
});

export const documentIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a valid number").transform(Number),
});

export const downloadTokenParamsSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const searchQuerySchema = z.object({
  tags: z.union([z.string(), z.array(z.string())]).transform((val) => {
    if (typeof val === "string") {
      return val.split(",").map((tag) => tag.trim()).filter(Boolean);
    }
    return val.flatMap((t) => 
      typeof t === "string" ? t.split(",").map((tag) => tag.trim()) : []
    );
  }),
});

// Response Schemas
export const documentResponseSchema = z.object({
  id: z.number(),
  filename: z.string(),
  originalFilename: z.string(),
  fileSize: z.number(),
  metadataTags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const documentListResponseSchema = z.array(documentResponseSchema);

export const uploadDocumentResponseSchema = z.object({
  id: z.number(),
  filename: z.string(),
  originalFilename: z.string(),
  fileSize: z.number(),
  metadataTags: z.array(z.string()),
  createdAt: z.string(),
});

export const updateDocumentResponseSchema = documentResponseSchema;

export const deleteDocumentResponseSchema = z.object({
  id: z.number(),
  filename: z.string(),
});

export const searchDocumentsResponseSchema = z.object({
  documents: documentListResponseSchema,
  count: z.number(),
  searchTags: z.array(z.string()),
});

export const downloadLinkResponseSchema = z.object({
  downloadUrl: z.string(),
  token: z.string(),
  expiresAt: z.string(),
  expiresInMinutes: z.number(),
  documentId: z.number(),
  originalFilename: z.string(),
});

// Standard API Response Wrapper
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string().optional(),
    data: dataSchema,
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.unknown().optional(),
});

// Type exports
export type DocumentResponse = z.infer<typeof documentResponseSchema>;
export type UploadDocumentResponse = z.infer<typeof uploadDocumentResponseSchema>;
export type UpdateDocumentResponse = z.infer<typeof updateDocumentResponseSchema>;
export type DeleteDocumentResponse = z.infer<typeof deleteDocumentResponseSchema>;
export type SearchDocumentsResponse = z.infer<typeof searchDocumentsResponseSchema>;
export type DownloadLinkResponse = z.infer<typeof downloadLinkResponseSchema>;
