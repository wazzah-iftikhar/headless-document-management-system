/**
 * oRPC Error Handler
 * 
 * Provides consistent error handling and sanitization for oRPC procedures.
 * Ensures sensitive data is never exposed to clients.
 */

import type { UseCaseError } from "../../application/errors/use-case.errors";

/**
 * Map UseCaseError to safe client error
 * 
 * Sanitizes error messages to prevent sensitive data exposure.
 */
export function mapUseCaseErrorToClientError(error: UseCaseError): Error {
  switch (error._tag) {
    case "DocumentNotFound":
      return new Error("Document not found");
    
    case "UserNotFound":
      return new Error("User not found");
    
    case "AccessPolicyNotFound":
      return new Error("Access policy not found");
    
    case "InvalidUploadToken":
      return new Error("Invalid upload token");
    
    case "UploadTokenExpired":
      return new Error("Upload token has expired");
    
    case "DuplicateUpload":
      return new Error("Duplicate upload detected");
    
    case "InvalidStatusTransition":
      return new Error(`Invalid status transition from ${error.from} to ${error.to}`);
    
    case "PermissionDenied":
      return new Error("Permission denied: You do not have permission to perform this action");
    
    case "ValidationError":
      // Sanitize validation error - remove any sensitive paths or IDs
      const sanitizedMessage = error.message
        .replace(/[A-Za-z0-9]{8}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{12}/g, "[id]")
        .replace(/\/[^\s]+/g, "[path]")
        .replace(/[A-Z]:\\[^\s]+/g, "[path]");
      return new Error(`Validation error in ${error.field}: ${sanitizedMessage}`);
    
    case "UseCaseUnknown":
      // Never expose internal error details
      return new Error("An error occurred while processing your request");
    
    default:
      return new Error("An error occurred");
  }
}
