/**
 * Application Layer Errors
 * 
 * Errors specific to the application/use case layer.
 * These are distinct from domain errors and infrastructure errors.
 */

export type UseCaseError =
  | { _tag: "DocumentNotFound"; documentId: string }
  | { _tag: "UserNotFound"; userId: string }
  | { _tag: "AccessPolicyNotFound"; policyId: string }
  | { _tag: "InvalidUploadToken"; token: string }
  | { _tag: "UploadTokenExpired"; token: string }
  | { _tag: "DuplicateUpload"; checksum: string; documentId: string }
  | { _tag: "InvalidStatusTransition"; from: string; to: string }
  | { _tag: "PermissionDenied"; userId: string; documentId: string; action: string }
  | { _tag: "ValidationError"; field: string; message: string }
  | { _tag: "UseCaseUnknown"; operation: string; message: string };
