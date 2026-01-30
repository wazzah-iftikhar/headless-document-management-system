import { Elysia, t } from "elysia";
import { DocumentController } from "../controllers/document.controller";
import {
  uploadDocumentSchema,
  downloadTokenParamsSchema,
} from "../validations/document.schema";
import { validateParams, validateBody } from "../middleware/schema-validator";

/**
 * Document Routes
 * 
 * Only handles file operations (upload and download).
 * All other operations should use oRPC at /rpc/document.*
 * 
 * Kept routes:
 * - POST /documents/upload - File upload (multipart/form-data)
 * - GET /documents/download/:token - Binary file download
 */
export const documentRoutes = new Elysia({ prefix: "/documents" })
  .post(
    "/upload",
    async ({ body }) => {
      const { file, metadataTags } = body;

      // Validate metadata tags if provided
      const bodyValidation = validateBody(uploadDocumentSchema, {
        metadataTags: metadataTags,
      });
      if (bodyValidation.error) {
        return bodyValidation.error.body;
      }

      return DocumentController.uploadDocument(
        file,
        bodyValidation.data.metadataTags ? [...bodyValidation.data.metadataTags] : []
      );
    },
    {
      body: t.Object({
        file: t.File({
          type: "application/pdf",
        }),
        metadataTags: t.Optional(t.Array(t.String())),
      }),
    }
  )
  .get(
    "/download/:token",
    async ({ params }) => {
      // Validate params
      const paramsValidation = validateParams(downloadTokenParamsSchema, params);
      if (paramsValidation.error) {
        return paramsValidation.error.body;
      }

      return DocumentController.downloadDocumentByToken(paramsValidation.data.token);
    },
    {
      params: t.Object({
        token: t.String(),
      }),
    }
  );
