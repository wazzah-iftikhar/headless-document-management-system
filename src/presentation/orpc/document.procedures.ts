/**
 * oRPC Procedures for Document Management
 * 
 * Type-safe RPC procedures that directly consume application DTOs.
 * These procedures are thin wrappers that:
 * - Extract context (workspace, user) from headers
 * - Call use cases with DTOs
 * - Return results
 * 
 * Effect Schema DTOs are used directly as oRPC input/output schemas.
 * This ensures end-to-end type safety from client to use cases.
 */

import { Procedure } from "@orpc/server";
import { Effect, pipe } from "effect";
import { Schema } from "@effect/schema";
import { AppLayer } from "../../effect/layers";
import { DatabaseService } from "../../effect/services/database.service";
import type { UseCaseError } from "../../application/errors/use-case.errors";
import { useCases, documentVersionRepository } from "../../application/composition-root";
import { persistenceToDomain as versionPersistenceToDomain } from "../../infrastructure/mappers/document-version.mapper";
import {
  CreateDocumentCommandSchema,
  InitiateUploadCommandSchema,
  ConfirmUploadCommandSchema,
  PublishDocumentCommandSchema,
  GetDocumentQuerySchema,
  ListDocumentsQuerySchema,
  DocumentResultSchema,
  UploadInitiationResultSchema,
  UploadConfirmationResultSchema,
} from "../../application/dtos/document.dtos";
import type {
  CreateDocumentCommand,
  InitiateUploadCommand,
  ConfirmUploadCommand,
  PublishDocumentCommand,
  GetDocumentQuery,
  ListDocumentsQuery,
  DocumentResult,
  UploadInitiationResult,
  UploadConfirmationResult,
} from "../../application/dtos/document.dtos";
import { createEffectSchemaValidator, type InferSchemaType } from "./schema-adapter";
import { extractContextFromHeaders, type RequestContext } from "./context-extractor";

/**
 * Effect Schema Validators for Input/Output
 * 
 * These validators use Effect Schema DTOs directly, providing:
 * - Runtime validation using Effect Schema
 * - Compile-time type inference
 * - Reusable across all procedures
 */
const CreateDocumentInputValidator = createEffectSchemaValidator(CreateDocumentCommandSchema);
const InitiateUploadInputValidator = createEffectSchemaValidator(InitiateUploadCommandSchema);
const ConfirmUploadInputValidator = createEffectSchemaValidator(ConfirmUploadCommandSchema);
const PublishDocumentInputValidator = createEffectSchemaValidator(PublishDocumentCommandSchema);
const GetDocumentInputValidator = createEffectSchemaValidator(GetDocumentQuerySchema);
const ListDocumentsInputValidator = createEffectSchemaValidator(ListDocumentsQuerySchema);

// Output validators (for response validation and type safety)
const DocumentResultOutputValidator = createEffectSchemaValidator(DocumentResultSchema);
const UploadInitiationOutputValidator = createEffectSchemaValidator(UploadInitiationResultSchema);
const UploadConfirmationOutputValidator = createEffectSchemaValidator(UploadConfirmationResultSchema);

/**
 * Helper to validate input using Effect Schema DTOs
 * This ensures type safety and validation using the same schemas as use cases
 */
async function validateWithEffectSchema<T>(
  validator: { validate: (input: unknown) => Promise<T> },
  input: unknown
): Promise<T> {
  return validator.validate(input);
}

/**
 * Helper to validate output using Effect Schema DTOs
 * Ensures response types match the expected DTO schemas
 */
async function validateOutputWithEffectSchema<T>(
  validator: { validate: (input: unknown) => Promise<T> },
  output: unknown
): Promise<T> {
  return validator.validate(output);
}

/**
 * Helper to execute use case and handle errors
 */
async function executeUseCase<T>(
  useCaseEffect: Effect.Effect<T, UseCaseError, DatabaseService>
): Promise<T> {
  return Effect.runPromise(
    pipe(
      useCaseEffect,
      Effect.provide(AppLayer),
      Effect.mapError((error: UseCaseError) => {
        throw mapUseCaseErrorToOrpcError(error);
      })
    )
  );
}

/**
 * Map UseCaseError to oRPC error format
 * oRPC uses standard HTTP status codes and error messages
 */
function mapUseCaseErrorToOrpcError(error: UseCaseError): Error {
  switch (error._tag) {
    case "DocumentNotFound":
      return new Error(`NOT_FOUND: Document with ID ${error.documentId} not found`);
    case "UserNotFound":
      return new Error(`NOT_FOUND: User with ID ${error.userId} not found`);
    case "AccessPolicyNotFound":
      return new Error(`NOT_FOUND: Access policy with ID ${error.policyId} not found`);
    case "InvalidUploadToken":
      return new Error(`BAD_REQUEST: Invalid upload token: ${error.token}`);
    case "UploadTokenExpired":
      return new Error(`BAD_REQUEST: Upload token has expired: ${error.token}`);
    case "DuplicateUpload":
      return new Error(`CONFLICT: Duplicate upload detected for document ${error.documentId}`);
    case "InvalidStatusTransition":
      return new Error(`BAD_REQUEST: Invalid status transition from ${error.from} to ${error.to}`);
    case "PermissionDenied":
      return new Error(`UNAUTHORIZED: Permission denied: User ${error.userId} cannot ${error.action} document ${error.documentId}`);
    case "ValidationError":
      return new Error(`BAD_REQUEST: Validation error in ${error.field}: ${error.message}`);
    case "UseCaseUnknown":
      return new Error(`INTERNAL_SERVER_ERROR: Use case error in ${error.operation}: ${error.message}`);
    default:
      return new Error(`INTERNAL_SERVER_ERROR: Unknown error`);
  }
}

/**
 * Document Management Procedures
 * 
 * These procedures wrap use cases and provide type-safe RPC endpoints.
 * Each procedure:
 * 1. Validates input using Effect Schema DTOs
 * 2. Executes the corresponding use case
 * 3. Maps errors to oRPC error format
 * 4. Returns the result
 */

/**
 * Create Document Procedure
 * Creates a document with metadata only (no file upload)
 * 
 * Input: CreateDocumentCommand (Effect Schema DTO)
 * Output: DocumentResult (Effect Schema DTO)
 * 
 * @param input - Command DTO
 * @param headers - Request headers for context extraction
 */
export async function createDocument(
  input: InferSchemaType<typeof CreateDocumentCommandSchema>,
  headers?: Headers | Record<string, string>
): Promise<InferSchemaType<typeof DocumentResultSchema>> {
  // Extract context from headers (workspace, user)
  const ctx = extractContextFromHeaders(headers);
  
  // Validate input using Effect Schema DTO directly
  const validatedInput = await validateWithEffectSchema(
    CreateDocumentInputValidator,
    input
  );
  
  // TODO: Pass context to use case when use cases support workspace context
  // For now, use cases operate without workspace context
  // In the future: useCase.execute(validatedInput, ctx)
  
  const result = await executeUseCase(useCases.createDocument.execute(validatedInput));
  
  // Validate output using Effect Schema DTO directly
  return validateOutputWithEffectSchema(DocumentResultOutputValidator, result);
}

/**
 * Initiate Upload Procedure
 * Initiates an upload workflow and returns upload token/URL
 * 
 * Input: InitiateUploadCommand (Effect Schema DTO)
 * Output: UploadInitiationResult (Effect Schema DTO)
 * 
 * @param input - Command DTO
 * @param headers - Request headers for context extraction
 */
export async function initiateUpload(
  input: InferSchemaType<typeof InitiateUploadCommandSchema>,
  headers?: Headers | Record<string, string>
): Promise<InferSchemaType<typeof UploadInitiationResultSchema>> {
  // Extract context from headers
  const ctx = extractContextFromHeaders(headers);
  
  const validatedInput = await validateWithEffectSchema(
    InitiateUploadInputValidator,
    input
  );
  
  // TODO: Pass context to use case when use cases support workspace context
  
  const result = await executeUseCase(useCases.initiateUpload.execute(validatedInput));
  return validateOutputWithEffectSchema(UploadInitiationOutputValidator, result);
}

/**
 * Confirm Upload Procedure
 * Confirms that an upload is complete and persists the document version
 * 
 * Input: ConfirmUploadCommand (Effect Schema DTO)
 * Output: UploadConfirmationResult (Effect Schema DTO)
 * 
 * @param input - Command DTO
 * @param headers - Request headers for context extraction
 */
export async function confirmUpload(
  input: InferSchemaType<typeof ConfirmUploadCommandSchema>,
  headers?: Headers | Record<string, string>
): Promise<InferSchemaType<typeof UploadConfirmationResultSchema>> {
  // Extract context from headers
  const ctx = extractContextFromHeaders(headers);
  
  const validatedInput = await validateWithEffectSchema(
    ConfirmUploadInputValidator,
    input
  );
  
  // TODO: Pass context to use case when use cases support workspace context
  
  const result = await executeUseCase(useCases.confirmUpload.execute(validatedInput));
  return validateOutputWithEffectSchema(UploadConfirmationOutputValidator, result);
}

/**
 * Publish Document Procedure
 * Changes document publish status (draft, published, archived)
 * 
 * Input: PublishDocumentCommand (Effect Schema DTO)
 * Output: DocumentResult (Effect Schema DTO)
 * 
 * @param input - Command DTO
 * @param headers - Request headers for context extraction
 */
export async function publishDocument(
  input: InferSchemaType<typeof PublishDocumentCommandSchema>,
  headers?: Headers | Record<string, string>
): Promise<InferSchemaType<typeof DocumentResultSchema>> {
  // Extract context from headers
  const ctx = extractContextFromHeaders(headers);
  
  const validatedInput = await validateWithEffectSchema(
    PublishDocumentInputValidator,
    input
  );
  
  // TODO: Pass context to use case when use cases support workspace context
  
  const result = await executeUseCase(useCases.publishDocument.execute(validatedInput));
  return validateOutputWithEffectSchema(DocumentResultOutputValidator, result);
}

/**
 * Get Document Procedure
 * Retrieves a document by ID
 * 
 * Input: GetDocumentQuery (Effect Schema DTO)
 * Output: DocumentResult (Effect Schema DTO)
 * 
 * @param input - Query DTO
 * @param headers - Request headers for context extraction
 */
export async function getDocument(
  input: InferSchemaType<typeof GetDocumentQuerySchema>,
  headers?: Headers | Record<string, string>
): Promise<InferSchemaType<typeof DocumentResultSchema>> {
  // Extract context from headers
  const ctx = extractContextFromHeaders(headers);
  
  const validatedInput = await validateWithEffectSchema(
    GetDocumentInputValidator,
    input
  );
  
  // TODO: Pass context to use case for workspace-scoped queries
  
  const result = await executeUseCase(useCases.getDocument.execute(validatedInput));
  return validateOutputWithEffectSchema(DocumentResultOutputValidator, result);
}

/**
 * List Documents Procedure
 * Lists documents with optional filtering (tags, status) and pagination
 * 
 * Input: ListDocumentsQuery (Effect Schema DTO)
 * Output: { documents: DocumentResult[]; total: number; page: number; limit: number }
 * 
 * @param input - Query DTO
 * @param headers - Request headers for context extraction
 */
export async function listDocuments(
  input: InferSchemaType<typeof ListDocumentsQuerySchema>,
  headers?: Headers | Record<string, string>
): Promise<{ documents: InferSchemaType<typeof DocumentResultSchema>[]; total: number; page: number; limit: number }> {
  // Extract context from headers
  const ctx = extractContextFromHeaders(headers);
  
  const validatedInput = await validateWithEffectSchema(
    ListDocumentsInputValidator,
    input
  );
  
  // TODO: Pass context to use case for workspace-scoped document listing
  // The use case should filter documents by workspaceId when context is available
  
  const result = await executeUseCase(useCases.listDocuments.execute(validatedInput));
  // Validate each document in the result
  const validatedDocuments = await Promise.all(
    result.documents.map((doc) => validateOutputWithEffectSchema(DocumentResultOutputValidator, doc))
  );
  return {
    ...result,
    documents: validatedDocuments,
  };
}

/**
 * Get Document Version History Procedure
 * Retrieves version history for a document with pagination
 * Returns all versions of a document ordered by version number (latest first)
 * 
 * @param input - Query parameters
 * @param headers - Request headers for context extraction
 */
export async function getVersionHistory(
  input: { documentId: string; page?: number; limit?: number },
  headers?: Headers | Record<string, string>
) {
  // Extract context from headers
  const ctx = extractContextFromHeaders(headers);
  
  // TODO: Verify document belongs to workspace before returning version history
  // Validate documentId is a UUID using Effect Schema
  const versionHistoryQuerySchema = Schema.Struct({
    documentId: pipe(
      Schema.String,
      Schema.filter(
        (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str),
        { message: () => "Document ID must be a valid UUID v4" }
      )
    ),
    page: Schema.optional(pipe(
      Schema.Number,
      Schema.filter((n) => n >= 1, { message: () => "Page must be >= 1" })
    )),
    limit: Schema.optional(pipe(
      Schema.Number,
      Schema.filter((n) => n >= 1 && n <= 1000, { message: () => "Limit must be between 1 and 1000" })
    )),
  });

  const versionHistoryQueryValidator = createEffectSchemaValidator(versionHistoryQuerySchema);
  const validatedInput = await validateWithEffectSchema(versionHistoryQueryValidator, input);
  
  const pagination = {
    page: validatedInput.page || 1,
    limit: validatedInput.limit || 20,
  };

  return Effect.runPromise(
    pipe(
      documentVersionRepository.findByDocumentId(validatedInput.documentId, pagination),
      Effect.provide(AppLayer),
      Effect.flatMap((paginated) =>
        pipe(
          Effect.all(
            paginated.data.map((persistence) => versionPersistenceToDomain(persistence))
          ),
          Effect.map((domains) => ({
            versions: domains.map((domain) => ({
              id: domain.id,
              documentId: domain.documentId,
              versionNumber: domain.versionNumber,
              createdAt: domain.createdAt.toISOString(),
            })),
            total: paginated.meta.total,
            page: paginated.meta.page,
            limit: paginated.meta.limit,
          }))
        )
      ),
      Effect.mapError((error) => {
        if (error._tag === "DocumentVersionNotFound") {
          throw new Error(`NOT_FOUND: Version history not found for document ${validatedInput.documentId}`);
        }
        throw new Error(`INTERNAL_SERVER_ERROR: Failed to retrieve version history: ${error._tag}`);
      })
    )
  );
}

/**
 * Document Router
 * 
 * This will be properly structured as an oRPC router when integrating with Hono.
 * For now, we export the procedures as functions that can be wrapped in oRPC
 * procedures in the next task.
 */
/**
 * Document Router
 * 
 * This will be properly structured as an oRPC router when integrating with Hono.
 * For now, we export the procedures as functions that can be wrapped in oRPC
 * procedures in the next task.
 */
export const documentProcedures = {
  // Document Management Workflows
  create: createDocument,
  initiateUpload,
  confirmUpload,
  publish: publishDocument,
  get: getDocument,
  
  // Query Procedures
  list: listDocuments,
  getVersionHistory,
  
  // Note: Slug-based queries are not yet implemented as documents don't have slug fields.
  // To add slug support:
  // 1. Add slug field to DocumentDomain and DocumentPersistence schemas
  // 2. Create GetDocumentBySlugQuery DTO
  // 3. Add getBySlug method to DocumentRepository
  // 4. Create GetDocumentBySlugUseCase
  // 5. Add getBySlug procedure here
};
