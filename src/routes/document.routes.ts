import { Elysia, t } from "elysia";
import { DocumentController } from "../controllers/document.controller";
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  searchDocumentSchema,
  documentIdParamsSchema,
  downloadTokenParamsSchema,
  searchQuerySchema,
} from "../validations/document.schema";
import { validateParams, validateQuery, validateBody } from "../middleware/zod-validator";

export const documentRoutes = new Elysia({ prefix: "/documents" })
  .post(
    "/upload",
    async ({ body }) => {
      const { file, metadataTags } = body;

      // Validate metadata tags if provided
      const bodyValidation = validateBody(uploadDocumentSchema, {
        metadataTags: metadataTags || [],
      });
      if (bodyValidation.error) {
        return bodyValidation.error.body;
      }

      return DocumentController.uploadDocument(
        file,
        bodyValidation.data.metadataTags
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
  .get("/", async () => {
    return DocumentController.getAllDocuments();
  })
  .get(
    "/search",
    async ({ query }) => {
      // Validate query params
      const queryValidation = validateQuery(searchQuerySchema, query);
      if (queryValidation.error) {
        return queryValidation.error.body;
      }

      // Validate tags after transformation
      const validationResult = searchDocumentSchema.safeParse({ tags: queryValidation.data.tags });

      if (!validationResult.success) {
        return {
          status: 400,
          body: {
            success: false,
            message: "Validation error",
            errors: validationResult.error.issues,
          },
        };
      }

      return DocumentController.searchDocumentsByTags(validationResult.data.tags);
    },
    {
      query: t.Object({
        tags: t.Union([t.String(), t.Array(t.String())]),
      }),
    }
  )
  .post(
    "/search",
    async ({ body }) => {
      // Support POST with body: { tags: ["tag1", "tag2"] }
      const bodyValidation = validateBody(searchDocumentSchema, body);
      if (bodyValidation.error) {
        return bodyValidation.error.body;
      }

      return DocumentController.searchDocumentsByTags(bodyValidation.data.tags);
    },
    {
      body: t.Object({
        tags: t.Array(t.String()),
      }),
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      // Validate params
      const paramsValidation = validateParams(documentIdParamsSchema, params);
      if (paramsValidation.error) {
        return paramsValidation.error.body;
      }

      return DocumentController.getDocumentById(paramsValidation.data.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      // Validate params
      const paramsValidation = validateParams(documentIdParamsSchema, params);
      if (paramsValidation.error) {
        return paramsValidation.error.body;
      }

      // Validate request body
      const bodyValidation = validateBody(updateDocumentSchema, body);
      if (bodyValidation.error) {
        return bodyValidation.error.body;
      }

      return DocumentController.updateDocument(
        paramsValidation.data.id,
        bodyValidation.data.metadataTags
      );
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        metadataTags: t.Optional(t.Array(t.String())),
      }),
    }
  )
  .delete(
    "/:id",
    async ({ params }) => {
      // Validate params
      const paramsValidation = validateParams(documentIdParamsSchema, params);
      if (paramsValidation.error) {
        return paramsValidation.error.body;
      }

      return DocumentController.deleteDocument(paramsValidation.data.id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  )
  .post(
    "/:id/download-link",
    async ({ params }) => {
      // Validate params
      const paramsValidation = validateParams(documentIdParamsSchema, params);
      if (paramsValidation.error) {
        return paramsValidation.error.body;
      }

      return DocumentController.generateDownloadLink(paramsValidation.data.id);
    },
    {
      params: t.Object({
        id: t.String(),
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
