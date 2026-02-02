import type { UseCaseError } from "../../application/errors/use-case.errors";
import type { HttpError } from "../errors/controller.errors";

/**
 * Map UseCaseError to HttpError at controller boundary
 * This prevents use case errors from leaking to routes
 */
export const mapUseCaseErrorToHttpError = (useCaseError: UseCaseError): HttpError => {
  switch (useCaseError._tag) {
    case "DocumentNotFound":
      return { _tag: "NotFound", message: `Document with ID ${useCaseError.documentId} not found` };
    case "UserNotFound":
      return { _tag: "NotFound", message: `User with ID ${useCaseError.userId} not found` };
    case "AccessPolicyNotFound":
      return { _tag: "NotFound", message: `Access policy with ID ${useCaseError.policyId} not found` };
    case "InvalidUploadToken":
      return { _tag: "BadRequest", message: `Invalid upload token: ${useCaseError.token}` };
    case "UploadTokenExpired":
      return { _tag: "BadRequest", message: `Upload token has expired: ${useCaseError.token}` };
    case "DuplicateUpload":
      return { _tag: "Conflict", message: `Duplicate upload detected for document ${useCaseError.documentId}` };
    case "InvalidStatusTransition":
      return { _tag: "BadRequest", message: `Invalid status transition from ${useCaseError.from} to ${useCaseError.to}` };
    case "PermissionDenied":
      return { _tag: "Forbidden", message: `Permission denied: User ${useCaseError.userId} cannot ${useCaseError.action} document ${useCaseError.documentId}` };
    case "ValidationError":
      return { _tag: "BadRequest", message: `Validation error in ${useCaseError.field}: ${useCaseError.message}` };
    case "UseCaseUnknown":
      return { _tag: "InternalServerError", message: `Use case error in ${useCaseError.operation}: ${useCaseError.message}` };
  }
};
