import { z } from "zod";

export const uploadDocumentSchema = z.object({
  metadataTags: z.array(z.string()).optional().default([]),
});

export const documentMetadataSchema = z.object({
  tags: z.array(z.string()).optional(),
});
