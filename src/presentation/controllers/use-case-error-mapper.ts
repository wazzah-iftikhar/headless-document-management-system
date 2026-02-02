import type { UseCaseError } from "../../application/errors/use-case.errors";
import type { HttpError } from "../errors/controller.errors";
import { sanitizeErrorMessage } from "../utils/error-sanitizer";

/**
 * Map UseCaseError to HttpError at controller boundary
 * 
 * This prevents use case errors from leaking to routes and ensures:
 * - Sensitive data is not exposed
 * - Error messages are sanitized
 * - Internal error details are hidden
 */
export const mapUseCaseErrorToHttpError = (useCaseError: UseCaseError): HttpError => {
  switch (useCaseError._tag) {
    case "DocumentNotFound":
      // Don't expose document ID in error message (could be sensitive)
      return { _tag: "NotFound", message: "Document not found" };
    
    case "UserNotFound":
      // Don't expose user ID in error message (could be sensitive)
      return { _tag: "NotFound", message: "User not found" };
    
    case "AccessPolicyNotFound":
      // Don't expose policy ID in error message
      return { _tag: "NotFound", message: "Access policy not found" };
    
    case "InvalidUploadToken":
      // Token is already invalid, safe to mention but not expose value
      return { _tag: "BadRequest", message: "Invalid upload token" };
    
    case "UploadTokenExpired":
      // Token is already expired, safe to mention
      return { _tag: "BadRequest", message: "Upload token has expired" };
    
    case "DuplicateUpload":
      // Don't expose document ID
      return { _tag: "Conflict", message: "Duplicate upload detected" };
    
    case "InvalidStatusTransition":
      // Status transitions are safe to expose
      return { 
        _tag: "BadRequest", 
        message: `Invalid status transition from ${useCaseError.from} to ${useCaseError.to}` 
      };
    
    case "PermissionDenied":
      // Don't expose user ID or document ID - generic message
      return { 
        _tag: "Forbidden", 
        message: "Permission denied: You do not have permission to perform this action" 
      };
    
    case "ValidationError":
      // Sanitize validation error message
      return { 
        _tag: "BadRequest", 
        message: sanitizeErrorMessage(
          useCaseError.message,
          `Validation error in ${useCaseError.field}`
        )
      };
    
    case "UseCaseUnknown":
      // Never expose internal error details
      return { 
        _tag: "InternalServerError", 
        message: "An internal error occurred. Please try again later." 
      };
  }
};
