import { Elysia, t } from "elysia";
import { DocumentController } from "../controllers/document.controller";
import { uploadDocumentSchema } from "../validations/document.schema";

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
            errors: validationResult.error.errors,
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
  );
