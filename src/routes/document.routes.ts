import { Elysia, t } from "elysia";
import { DocumentController } from "../controllers/document.controller";
import {
  uploadDocumentSchema,
  updateDocumentSchema,
  searchDocumentSchema,
} from "../validations/document.schema";

export const documentRoutes = new Elysia({ prefix: "/documents" })
  .post(
    "/upload",
    async ({ body }) => {
      const { file, metadataTags } = body;

      // Validate metadata tags if provided
      const validationResult = uploadDocumentSchema.safeParse({
        metadataTags: metadataTags || [],
      });

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

      return DocumentController.uploadDocument(
        file,
        validationResult.data.metadataTags
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
      // Support query parameter: ?tags=tag1,tag2,tag3
      const tagsParam = query.tags;
      let tags: string[] = [];

      if (tagsParam) {
        // Parse comma-separated tags
        tags = typeof tagsParam === "string" 
          ? tagsParam.split(",").map((tag) => tag.trim()).filter(Boolean)
          : Array.isArray(tagsParam)
          ? tagsParam.flatMap((t) => (typeof t === "string" ? t.split(",").map((tag) => tag.trim()) : []))
          : [];
      }

      // Validate tags
      const validationResult = searchDocumentSchema.safeParse({ tags });

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
      const validationResult = searchDocumentSchema.safeParse(body);

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
      body: t.Object({
        tags: t.Array(t.String()),
      }),
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const id = parseInt(params.id);
      if (isNaN(id)) {
        return {
          status: 400,
          body: {
            success: false,
            message: "Invalid document ID",
          },
        };
      }
      return DocumentController.getDocumentById(id);
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
      const id = parseInt(params.id);
      if (isNaN(id)) {
        return {
          status: 400,
          body: {
            success: false,
            message: "Invalid document ID",
          },
        };
      }

      // Validate request body
      const validationResult = updateDocumentSchema.safeParse(body);

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

      return DocumentController.updateDocument(
        id,
        validationResult.data.metadataTags
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
      const id = parseInt(params.id);
      if (isNaN(id)) {
        return {
          status: 400,
          body: {
            success: false,
            message: "Invalid document ID",
          },
        };
      }
      return DocumentController.deleteDocument(id);
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    }
  );
