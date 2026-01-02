import type { ServiceError } from "./service.errors";

/**
 * Controller/HTTP Layer Errors
 * Transport-level errors for HTTP responses
 */
export type HttpError =
  | { _tag: "BadRequest"; message: string }
  | { _tag: "NotFound"; message: string }
  | { _tag: "Conflict"; message: string }
  | { _tag: "Unavailable"; message: string }
  | { _tag: "InternalServerError"; message: string };

/**
 * Map ServiceError to HttpError at controller boundary
 * This prevents service errors from leaking to routes
 */
export const mapServiceErrorToHttpError = (serviceError: ServiceError): HttpError => {
  switch (serviceError._tag) {
    // Domain errors -> appropriate HTTP status codes
    case "DocumentNotFound":
      return { _tag: "NotFound", message: `Document with ID ${serviceError.documentId} not found` };
    case "FileNotFound":
      return { _tag: "NotFound", message: `File not found: ${serviceError.filePath}` };
    case "InvalidFileType":
      return { _tag: "BadRequest", message: serviceError.message };
    case "FileTooLarge":
      return {
        _tag: "BadRequest",
        message: `File size ${serviceError.actualSize} exceeds maximum ${serviceError.maxSize}`,
      };
    case "InvalidSearchTags":
      return { _tag: "BadRequest", message: serviceError.message };
    case "DownloadTokenExpired":
      return { _tag: "NotFound", message: "Download token has expired" };
    case "DownloadTokenInvalid":
      return { _tag: "NotFound", message: "Invalid download token" };
    case "DownloadTokenAlreadyUsed":
      return { _tag: "Conflict", message: "Download token has already been used" };

    // Service infrastructure errors -> 503/500
    case "ServiceUnavailable":
      return { _tag: "Unavailable", message: "Service temporarily unavailable" };
    case "ServiceUnknown":
      return { _tag: "InternalServerError", message: serviceError.message };
  }
};

/**
 * Convert HttpError to HTTP status code
 */
export const httpErrorToStatus = (error: HttpError): number => {
  switch (error._tag) {
    case "BadRequest":
      return 400;
    case "NotFound":
      return 404;
    case "Conflict":
      return 409;
    case "Unavailable":
      return 503;
    case "InternalServerError":
      return 500;
  }
};

