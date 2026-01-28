/**
 * Composition Root
 * 
 * This is the single place where all dependencies are wired together.
 * Following hexagonal architecture principles:
 * - Application layer defines ports (interfaces)
 * - Infrastructure layer provides adapters (implementations)
 * - Composition root wires them together
 * 
 * This ensures:
 * - Dependency Inversion: Application depends on abstractions (ports)
 * - Single Responsibility: Dependency wiring is centralized
 * - Testability: Easy to swap implementations for testing
 */

import { DocumentRepositoryImpl } from "../infrastructure/repositories/implementations/document.repository.impl";
import { UserRepositoryImpl } from "../infrastructure/repositories/implementations/user.repository.impl";
import { AccessPolicyRepositoryImpl } from "../infrastructure/repositories/implementations/access-policy.repository.impl";
import { DocumentVersionRepositoryImpl } from "../infrastructure/repositories/implementations/document-version.repository.impl";

import { CreateDocumentUseCase } from "./use-cases/create-document.use-case";
import { GetDocumentUseCase, ListDocumentsUseCase } from "./use-cases/document-queries.use-case";
import { InitiateUploadUseCase, ConfirmUploadUseCase } from "./use-cases/upload-workflow.use-case";
import { PublishDocumentUseCase, UpdateDocumentMetadataUseCase } from "./use-cases/document-operations.use-case";
import { ManageAccessPolicyUseCase, CheckPermissionUseCase } from "./use-cases/access-control.use-case";

/**
 * Repository Instances (Adapters)
 * 
 * These are the concrete implementations of the repository ports.
 * In a real application, these might be created with different configurations
 * (e.g., different database connections, caching layers, etc.)
 */
export const documentRepository = new DocumentRepositoryImpl();
export const userRepository = new UserRepositoryImpl();
export const accessPolicyRepository = new AccessPolicyRepositoryImpl();
export const documentVersionRepository = new DocumentVersionRepositoryImpl();

/**
 * Use Case Instances
 * 
 * These are wired with their dependencies (repositories) via constructor injection.
 * All use cases depend on ports (interfaces), not adapters (implementations).
 */
export const createDocumentUseCase = new CreateDocumentUseCase(documentRepository);
export const getDocumentUseCase = new GetDocumentUseCase(documentRepository);
export const listDocumentsUseCase = new ListDocumentsUseCase(documentRepository);
export const initiateUploadUseCase = new InitiateUploadUseCase(documentRepository);
export const confirmUploadUseCase = new ConfirmUploadUseCase(documentRepository, documentVersionRepository);
export const publishDocumentUseCase = new PublishDocumentUseCase(documentRepository);
export const updateDocumentMetadataUseCase = new UpdateDocumentMetadataUseCase(documentRepository);
export const manageAccessPolicyUseCase = new ManageAccessPolicyUseCase(documentRepository, accessPolicyRepository);
export const checkPermissionUseCase = new CheckPermissionUseCase(documentRepository, userRepository, accessPolicyRepository);

/**
 * Use Cases Container
 * 
 * Convenient export of all use cases for easy access.
 */
export const useCases = {
  createDocument: createDocumentUseCase,
  getDocument: getDocumentUseCase,
  listDocuments: listDocumentsUseCase,
  initiateUpload: initiateUploadUseCase,
  confirmUpload: confirmUploadUseCase,
  publishDocument: publishDocumentUseCase,
  updateDocumentMetadata: updateDocumentMetadataUseCase,
  manageAccessPolicy: manageAccessPolicyUseCase,
  checkPermission: checkPermissionUseCase,
} as const;
