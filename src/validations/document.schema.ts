import { z } from "zod";

export const uploadDocumentSchema = z.object({
  metadataTags: z.array(z.string()).optional().default([]),
});

export const documentMetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
});

export const updateDocumentSchema = z.object({
  metadataTags: z.array(z.string()).optional(),
});

export const searchDocumentSchema = z.object({
  tags: z.array(z.string()).min(1, "At least one tag is required for search"),
});
