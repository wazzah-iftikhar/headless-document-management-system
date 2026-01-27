/**
 * Repository Test Data Builders
 * 
 * Builders for creating test data for repository operations.
 * Uses test fixtures for consistent, deterministic data.
 */

import {
  createDocumentPersistence,
  createUserPersistence,
  createAccessPolicyPersistence,
  createDocumentVersionPersistence,
  resetUuidSeed,
} from "../fixtures";
import type { DocumentPersistence } from "../../domain/document/document.entity.schema";
import type { UserPersistence } from "../../domain/user/user.entity.schema";
import type { AccessPolicyPersistence } from "../../domain/access-policy/access-policy.entity.schema";
import type { DocumentVersionPersistence } from "../../domain/document/document-version.entity.schema";

/**
 * Document Repository Test Builder
 * 
 * Provides fluent API for building test documents
 */
export class DocumentTestBuilder {
  private options: Parameters<typeof createDocumentPersistence>[0] = {};

  withId(id: string): this {
    this.options.id = id;
    return this;
  }

  withFilename(filename: string): this {
    this.options.filename = filename;
    return this;
  }

  withOriginalFilename(originalFilename: string): this {
    this.options.originalFilename = originalFilename;
    return this;
  }

  withFilePath(filePath: string): this {
    this.options.filePath = filePath;
    return this;
  }

  withFileSize(fileSize: number): this {
    this.options.fileSize = fileSize;
    return this;
  }

  withChecksum(checksum: string): this {
    this.options.checksum = checksum;
    return this;
  }

  withMetadataTags(tags: string[]): this {
    this.options.metadataTags = tags;
    return this;
  }

  withIndex(index: number): this {
    this.options.index = index;
    return this;
  }

  build(): DocumentPersistence {
    return createDocumentPersistence(this.options);
  }

  buildCreateData(): Omit<DocumentPersistence, "id" | "createdAt" | "updatedAt"> {
    const doc = this.build();
    const { id, createdAt, updatedAt, ...createData } = doc;
    return createData;
  }
}

/**
 * User Repository Test Builder
 */
export class UserTestBuilder {
  private options: Parameters<typeof createUserPersistence>[0] = {};

  withId(id: string): this {
    this.options.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.options.email = email;
    return this;
  }

  withRole(role: string): this {
    this.options.role = role;
    return this;
  }

  withWorkspaceIds(workspaceIds: string[]): this {
    this.options.workspaceIds = workspaceIds;
    return this;
  }

  withIsActive(isActive: boolean): this {
    this.options.isActive = isActive;
    return this;
  }

  withIndex(index: number): this {
    this.options.index = index;
    return this;
  }

  build(): UserPersistence {
    return createUserPersistence(this.options);
  }

  buildCreateData(): Omit<UserPersistence, "id" | "createdAt" | "updatedAt"> {
    const user = this.build();
    const { id, createdAt, updatedAt, ...createData } = user;
    return createData;
  }
}

/**
 * Access Policy Repository Test Builder
 */
export class AccessPolicyTestBuilder {
  private options: Parameters<typeof createAccessPolicyPersistence>[0] = {};

  withId(id: string): this {
    this.options.id = id;
    return this;
  }

  withSubjectType(subjectType: string): this {
    this.options.subjectType = subjectType;
    return this;
  }

  withSubjectId(subjectId: string): this {
    this.options.subjectId = subjectId;
    return this;
  }

  withResourceType(resourceType: string): this {
    this.options.resourceType = resourceType;
    return this;
  }

  withResourceId(resourceId: string | null): this {
    this.options.resourceId = resourceId;
    return this;
  }

  withActions(actions: string[]): this {
    this.options.actions = actions;
    return this;
  }

  withIsActive(isActive: boolean): this {
    this.options.isActive = isActive;
    return this;
  }

  withIndex(index: number): this {
    this.options.index = index;
    return this;
  }

  build(): AccessPolicyPersistence {
    return createAccessPolicyPersistence(this.options);
  }

  buildCreateData(): Omit<AccessPolicyPersistence, "id" | "createdAt" | "updatedAt"> {
    const policy = this.build();
    const { id, createdAt, updatedAt, ...createData } = policy;
    return createData;
  }
}

/**
 * Document Version Repository Test Builder
 */
export class DocumentVersionTestBuilder {
  private options: Parameters<typeof createDocumentVersionPersistence>[0] = {};

  withId(id: string): this {
    this.options.id = id;
    return this;
  }

  withDocumentId(documentId: string): this {
    this.options.documentId = documentId;
    return this;
  }

  withVersionNumber(versionNumber: number): this {
    this.options.versionNumber = versionNumber;
    return this;
  }

  withIndex(index: number): this {
    this.options.index = index;
    return this;
  }

  build(): DocumentVersionPersistence {
    return createDocumentVersionPersistence(this.options);
  }

  buildCreateData(): Omit<DocumentVersionPersistence, "id" | "createdAt"> {
    const version = this.build();
    const { id, createdAt, ...createData } = version;
    return createData;
  }
}

/**
 * Factory functions for creating test builders
 */
export function documentBuilder(): DocumentTestBuilder {
  return new DocumentTestBuilder();
}

export function userBuilder(): UserTestBuilder {
  return new UserTestBuilder();
}

export function accessPolicyBuilder(): AccessPolicyTestBuilder {
  return new AccessPolicyTestBuilder();
}

export function documentVersionBuilder(): DocumentVersionTestBuilder {
  return new DocumentVersionTestBuilder();
}

/**
 * Reset builders (resets UUID seed)
 */
export function resetBuilders(): void {
  resetUuidSeed();
}
