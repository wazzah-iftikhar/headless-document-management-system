/**
 * Repository Assertion Helpers
 * 
 * Provides assertion utilities for repository testing.
 * Focuses on behavior verification rather than implementation details.
 */

import type { DocumentPersistence } from "../../domain/document/document.entity.schema";
import type { UserPersistence } from "../../domain/user/user.entity.schema";
import type { AccessPolicyPersistence } from "../../domain/access-policy/access-policy.entity.schema";
import type { DocumentVersionPersistence } from "../../domain/document/document-version.entity.schema";
import type { Paginated } from "../../types/pagination";

/**
 * Assert document persistence matches expected values
 */
export function assertDocumentMatches(
  actual: DocumentPersistence,
  expected: Partial<DocumentPersistence>
): void {
  if (expected.id !== undefined) {
    expect(actual.id).toBe(expected.id);
  }
  if (expected.filename !== undefined) {
    expect(actual.filename).toBe(expected.filename);
  }
  if (expected.originalFilename !== undefined) {
    expect(actual.originalFilename).toBe(expected.originalFilename);
  }
  if (expected.filePath !== undefined) {
    expect(actual.filePath).toBe(expected.filePath);
  }
  if (expected.fileSize !== undefined) {
    expect(actual.fileSize).toBe(expected.fileSize);
  }
  if (expected.checksum !== undefined) {
    expect(actual.checksum).toBe(expected.checksum);
  }
  if (expected.metadataTags !== undefined) {
    const actualTags = typeof actual.metadataTags === "string" 
      ? JSON.parse(actual.metadataTags) 
      : actual.metadataTags;
    const expectedTags = typeof expected.metadataTags === "string"
      ? JSON.parse(expected.metadataTags)
      : expected.metadataTags;
    expect(actualTags).toEqual(expectedTags);
  }
  if (expected.createdAt !== undefined) {
    expect(actual.createdAt).toBe(expected.createdAt);
  }
  if (expected.updatedAt !== undefined) {
    expect(actual.updatedAt).toBe(expected.updatedAt);
  }
}

/**
 * Assert user persistence matches expected values
 */
export function assertUserMatches(
  actual: UserPersistence,
  expected: Partial<UserPersistence>
): void {
  if (expected.id !== undefined) {
    expect(actual.id).toBe(expected.id);
  }
  if (expected.email !== undefined) {
    expect(actual.email).toBe(expected.email);
  }
  if (expected.role !== undefined) {
    expect(actual.role).toBe(expected.role);
  }
  if (expected.workspaceIds !== undefined) {
    const actualWorkspaces = typeof actual.workspaceIds === "string"
      ? JSON.parse(actual.workspaceIds)
      : actual.workspaceIds;
    const expectedWorkspaces = typeof expected.workspaceIds === "string"
      ? JSON.parse(expected.workspaceIds)
      : expected.workspaceIds;
    expect(actualWorkspaces).toEqual(expectedWorkspaces);
  }
  if (expected.isActive !== undefined) {
    expect(actual.isActive).toBe(expected.isActive);
  }
}

/**
 * Assert access policy persistence matches expected values
 */
export function assertAccessPolicyMatches(
  actual: AccessPolicyPersistence,
  expected: Partial<AccessPolicyPersistence>
): void {
  if (expected.id !== undefined) {
    expect(actual.id).toBe(expected.id);
  }
  if (expected.subjectType !== undefined) {
    expect(actual.subjectType).toBe(expected.subjectType);
  }
  if (expected.subjectId !== undefined) {
    expect(actual.subjectId).toBe(expected.subjectId);
  }
  if (expected.resourceType !== undefined) {
    expect(actual.resourceType).toBe(expected.resourceType);
  }
  if (expected.resourceId !== undefined) {
    expect(actual.resourceId).toBe(expected.resourceId);
  }
  if (expected.actions !== undefined) {
    const actualActions = typeof actual.actions === "string"
      ? JSON.parse(actual.actions)
      : actual.actions;
    const expectedActions = typeof expected.actions === "string"
      ? JSON.parse(expected.actions)
      : expected.actions;
    expect(actualActions).toEqual(expectedActions);
  }
  if (expected.isActive !== undefined) {
    expect(actual.isActive).toBe(expected.isActive);
  }
}

/**
 * Assert document version persistence matches expected values
 */
export function assertDocumentVersionMatches(
  actual: DocumentVersionPersistence,
  expected: Partial<DocumentVersionPersistence>
): void {
  if (expected.id !== undefined) {
    expect(actual.id).toBe(expected.id);
  }
  if (expected.documentId !== undefined) {
    expect(actual.documentId).toBe(expected.documentId);
  }
  if (expected.versionNumber !== undefined) {
    expect(actual.versionNumber).toBe(expected.versionNumber);
  }
  if (expected.createdAt !== undefined) {
    expect(actual.createdAt).toBe(expected.createdAt);
  }
}

/**
 * Assert paginated result structure
 */
export function assertPaginatedResult<T>(
  result: Paginated<T>,
  expectedCount?: number,
  expectedPage?: number,
  expectedLimit?: number
): void {
  expect(result).toHaveProperty("data");
  expect(result).toHaveProperty("meta");
  expect(Array.isArray(result.data)).toBe(true);
  
  if (expectedCount !== undefined) {
    expect(result.data.length).toBe(expectedCount);
  }
  if (expectedPage !== undefined) {
    expect(result.meta.page).toBe(expectedPage);
  }
  if (expectedLimit !== undefined) {
    expect(result.meta.limit).toBe(expectedLimit);
  }
  expect(result.meta.total).toBeGreaterThanOrEqual(result.data.length);
}

/**
 * Assert document was created with correct structure
 */
export function assertDocumentCreated(
  document: DocumentPersistence,
  expectedData: {
    filename: string;
    originalFilename: string;
    filePath: string;
    fileSize: number;
    metadataTags?: string[];
  }
): void {
  expect(document.id).toBeDefined();
  expect(document.filename).toBe(expectedData.filename);
  expect(document.originalFilename).toBe(expectedData.originalFilename);
  expect(document.filePath).toBe(expectedData.filePath);
  expect(document.fileSize).toBe(expectedData.fileSize);
  
  if (expectedData.metadataTags) {
    const tags = typeof document.metadataTags === "string"
      ? JSON.parse(document.metadataTags)
      : document.metadataTags;
    expect(tags).toEqual(expectedData.metadataTags);
  }
  
  expect(document.createdAt).toBeDefined();
  expect(document.updatedAt).toBeDefined();
}

/**
 * Assert document was updated correctly
 */
export function assertDocumentUpdated(
  before: DocumentPersistence,
  after: DocumentPersistence,
  expectedChanges: Partial<DocumentPersistence>
): void {
  expect(after.id).toBe(before.id);
  expect(after.createdAt).toBe(before.createdAt);
  
  // Check updated fields
  if (expectedChanges.filename !== undefined) {
    expect(after.filename).toBe(expectedChanges.filename);
  }
  if (expectedChanges.fileSize !== undefined) {
    expect(after.fileSize).toBe(expectedChanges.fileSize);
  }
  if (expectedChanges.checksum !== undefined) {
    expect(after.checksum).toBe(expectedChanges.checksum);
  }
  
  // UpdatedAt should be different (or at least defined)
  expect(after.updatedAt).toBeDefined();
}
