import { Effect, pipe } from "effect";
import { AppLayer } from "../../effect/layers";
import { errorResponse } from "../utils/response";
import type { HttpError } from "../errors/controller.errors";
import { mapUseCaseErrorToHttpError } from "./use-case-error-mapper";
import { httpErrorToStatus } from "../errors/controller.errors";
import { validateResponse } from "../middleware/schema-validator";
import {
  uploadDocumentResponseSchema,
  successResponseSchema,
} from "../validations/document.schema";
import { successResponse } from "../utils/response";

// Import use cases from composition root
import { useCases } from "../../application/composition-root";

/**
 * Document Controller
 * 
 * Handles ONLY file operations (upload and download).
 * All other operations should use oRPC procedures.
 * 
 * This controller is kept for:
 * - File uploads (multipart/form-data) - HTTP handles this better
 * - Binary file downloads - HTTP returns files with proper headers
 */
export class DocumentController {

  /**
   * Upload Document
   * Handles file upload via multipart/form-data
   * This is the only non-RPC operation that needs HTTP
   */
  static async uploadDocument(file: File, metadataTags?: string[]) {
    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Get file metadata
    const originalFilename = file.name;
    const fileSize = file.size;

    // Use the upload workflow use case
    // First, create the document
    const createCommand = {
      filename: `${Date.now()}_${originalFilename}`,
      originalFilename,
      metadataTags: metadataTags || [],
    };

    return Effect.runPromise(
      pipe(
        useCases.createDocument.execute(createCommand),
        Effect.provide(AppLayer),
        Effect.mapError((useCaseError) => mapUseCaseErrorToHttpError(useCaseError)),
        Effect.flatMap((document) =>
          // Save the file to disk
          Effect.tryPromise({
            try: async () => {
              const filePath = `./uploads/${document.filename}`;
              await Bun.write(filePath, buffer);
              return { document, fileSize };
            },
            catch: (error) => new Error(`Failed to save file: ${error instanceof Error ? error.message : String(error)}`),
          })
        ),
        Effect.match({
          onFailure: (httpError: HttpError | Error) => {
            const status = httpError instanceof Error && 'status' in httpError 
              ? httpErrorToStatus(httpError as HttpError)
              : 500;
            const message = httpError instanceof Error ? httpError.message : String(httpError);
            return {
              status,
              body: errorResponse(message),
            };
          },
          onSuccess: ({ document, fileSize }) => {
            const validatedData = validateResponse({
              id: document.id,
              filename: document.filename,
              originalFilename: document.originalFilename,
              fileSize,
              metadataTags: document.metadataTags,
              createdAt: document.createdAt,
            }, uploadDocumentResponseSchema);

            const response = successResponse(validatedData, "Document uploaded successfully");
            return {
              status: 201,
              body: validateResponse(response, successResponseSchema(uploadDocumentResponseSchema)),
            };
          },
        })
      )
    );
  }

  /**
   * Download Document by Token
   * Returns binary PDF file with proper HTTP headers
   * This needs HTTP for binary file delivery
   */
  static async downloadDocumentByToken(token: string) {
    const query = { token };
    return Effect.runPromise(
      pipe(
        useCases.downloadByToken.execute(query),
        Effect.provide(AppLayer),
        Effect.mapError((useCaseError) => mapUseCaseErrorToHttpError(useCaseError)),
        Effect.match({
          onFailure: (httpError: HttpError) => {
            const status = httpErrorToStatus(httpError);
            return new Response(
              JSON.stringify(errorResponse(httpError.message)),
              {
                status,
                headers: { "Content-Type": "application/json" },
              }
            );
          },
          onSuccess: (downloadData) => {
            const file = Bun.file(downloadData.filePath);
            return new Response(file, {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${downloadData.document.originalFilename}"`,
                "Content-Length": downloadData.document.fileSize.toString(),
              },
            });
          },
        })
      )
    );
  }
}
