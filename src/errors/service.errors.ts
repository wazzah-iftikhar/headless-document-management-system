import type { RepoError } from "./repository.errors";

/**
 * Domain Errors
 * Business rule violations and expected failures
 */
export type DomainError =
  | { _tag: "DocumentNotFound"; documentId: number }
  | { _tag: "FileNotFound"; filePath: string }
  | { _tag: "InvalidFileType"; message: string }
  | { _tag: "FileTooLarge"; maxSize: number; actualSize: number }
  | { _tag: "InvalidSearchTags"; message: string }
  | { _tag: "DownloadTokenExpired"; token: string }
  | { _tag: "DownloadTokenInvalid"; token: string }
  | { _tag: "DownloadTokenAlreadyUsed"; token: string };

/**
 * Service Infrastructure Errors
 * Unexpected infrastructure failures at service level
 * These are mapped from RepoError to hide DB details
 */
export type ServiceInfraError =
  | { _tag: "ServiceUnavailable"; operation: string }
  | { _tag: "ServiceUnknown"; operation: string; message: string };

/**
 * Service Layer Errors
 * Union of domain and infrastructure errors
 */
export type ServiceError = DomainError | ServiceInfraError;

/**
 * Map RepoError to ServiceError at service boundary
 * This prevents repository errors from leaking to controllers
 * Maps token errors to domain errors, DB errors to infrastructure errors
 */
export const mapRepoErrorToServiceError = (
  repoError: RepoError,
  operation: string
): ServiceError => {
  switch (repoError._tag) {
    case "TokenNotFound":
      return { _tag: "DownloadTokenInvalid", token: repoError.token };
    case "TokenExpired":
      return { _tag: "DownloadTokenExpired", token: repoError.token };
    case "DbConnectionError":
    case "DbTimeoutError":
      return { _tag: "ServiceUnavailable", operation };
    case "DbConstraintViolation":
    case "DbUnknown":
      return { _tag: "ServiceUnknown", operation, message: repoError.message };
  }
};

