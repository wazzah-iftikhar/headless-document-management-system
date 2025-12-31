import { db } from "../config/database";
import { documents, downloadTokens } from "../models";
import { eq, and, gt } from "drizzle-orm";
import type { Document, NewDocument } from "../models";
import type { DownloadToken, NewDownloadToken } from "../models/download-token.model";

export class DocumentRepository {
  static async create(data: NewDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(data)
      .returning();
    
    if (!document) {
      throw new Error("Failed to create document");
    }
    
    return document;
  }

  static async findAll(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  static async findById(id: number): Promise<Document | null> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);
    
    return document || null;
  }

  static async update(id: number, data: Partial<Document>): Promise<Document> {
    const [document] = await db
      .update(documents)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(documents.id, id))
      .returning();
    
    if (!document) {
      throw new Error("Document not found");
    }
    
    return document;
  }

  static async delete(id: number): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  static async findByTags(searchTags: string[]): Promise<Document[]> {
    const allDocuments = await db.select().from(documents);
    
    return allDocuments.filter((doc) => {
      if (!doc.metadataTags) return false;
      try {
        const docTags: string[] = JSON.parse(doc.metadataTags);
        return searchTags.some((searchTag) =>
          docTags.some(
            (docTag) =>
              docTag.toLowerCase() === searchTag.toLowerCase() ||
              docTag.toLowerCase().includes(searchTag.toLowerCase())
          )
        );
      } catch {
        return false;
      }
    });
  }
}

export class DownloadTokenRepository {
  static async create(data: NewDownloadToken): Promise<DownloadToken> {
    const [token] = await db
      .insert(downloadTokens)
      .values(data)
      .returning();
    
    if (!token) {
      throw new Error("Failed to create download token");
    }
    
    return token;
  }

  static async findValidToken(token: string): Promise<DownloadToken | null> {
    const now = new Date().toISOString();
    const [tokenRecord] = await db
      .select()
      .from(downloadTokens)
      .where(
        and(
          eq(downloadTokens.token, token),
          gt(downloadTokens.expiresAt, now)
        )
      )
      .limit(1);
    
    return tokenRecord || null;
  }

  static async markAsUsed(id: number): Promise<void> {
    await db
      .update(downloadTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(downloadTokens.id, id));
  }
}

