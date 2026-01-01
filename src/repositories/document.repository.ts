import { db } from "../config/database";
import { documents, downloadTokens } from "../models";
import { eq, and, gt } from "drizzle-orm";
import type { Document, NewDocument } from "../models";
import type { DownloadToken, NewDownloadToken } from "../models/download-token.model";
import { ok, err, type Result } from "../utils/result";
import { safeParseJSON } from "../utils/safe-parse";

export class DocumentRepository {

  static create(data: NewDocument): Promise<Result<Document>> {
    return db
      .insert(documents)
      .values(data)
      .returning()
      .then(([document]) =>
        document ? ok(document) : err(new Error("Failed to create document"))
      )
      .catch((e) => err(e instanceof Error ? e : new Error(String(e))));  
  }

  static findAll(): Promise<Result<Document[]>> {
    return db
      .select()
      .from(documents)
      .then((rows) => ok(rows))
      .catch((e) => err(e instanceof Error ? e : new Error(String(e))));
  }

  static findById(id: number): Promise<Result<Document>> {
    return db
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1)
      .then(([document]) =>
        document ? ok(document) : err(new Error("Document not found"))
      )
      .catch((e) => err(e instanceof Error ? e : new Error(String(e))));
  }

  static update(id: number, data: Partial<Document>): Promise<Result<Document>> {
    return db
      .update(documents)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(documents.id, id))
      .returning()
      .then(([document]) =>
        document ? ok(document) : err(new Error("Document not found"))
      )
      .catch((e) => err(e instanceof Error ? e : new Error(String(e))));
  }

 static delete(id: number): Promise<Result<void>> {
  return db
    .delete(documents)
    .where(eq(documents.id, id))
    .then((res: any) => {
      const affected =
        res?.rowCount ?? res?.affectedRows ?? res?.length ?? (typeof res === "number" ? res : undefined);
      return affected === 0
        ? err(new Error("Document not found"))
        : ok<void>(undefined);
    })
    .catch((e) => err(e instanceof Error ? e : new Error(String(e))));
}

  static findByTags(searchTags: string[]): Promise<Result<Document[]>> {
    return db
      .select()
      .from(documents)
      .then((rows) => {
        const filtered = rows.filter((doc) => {
          if (!doc.metadataTags) return false;
          const parsed = safeParseJSON<string[]>(doc.metadataTags);
          if (!parsed.ok) return false;
          const docTags = parsed.value;
          return searchTags.some((searchTag) =>
            docTags.some(
              (docTag) =>
                docTag.toLowerCase() === searchTag.toLowerCase() ||
                docTag.toLowerCase().includes(searchTag.toLowerCase())
            )
          );
        });
        return ok(filtered);
      })
      .catch((e) => err(e instanceof Error ? e : new Error(String(e))));
}
}

export class DownloadTokenRepository {

  static create(data: NewDownloadToken): Promise<Result<DownloadToken>> {
    return db
      .insert(downloadTokens)
      .values(data)
      .returning()
      .then(([token]) =>
        token ? ok(token) : err(new Error("Failed to create download token"))
      )
      .catch((e) => err(e instanceof Error ? e : new Error(String(e))));

  }

  static findValidToken(token: string): Promise<Result<DownloadToken>> {
    const now = new Date().toISOString();
    return db
      .select()
      .from(downloadTokens)
      .where(
        and(
          eq(downloadTokens.token, token),
          gt(downloadTokens.expiresAt, now)
        )
      )
      .limit(1)
      .then(([tokenRecord]) =>
        tokenRecord ? ok(tokenRecord) : err(new Error("Download token not found"))
      )
      .catch((e) => err(e instanceof Error ? e : new Error(String(e))));
  }

  static markAsUsed(id: number): Promise<Result<void>> {
    return db
      .update(downloadTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(downloadTokens.id, id))
      .then((res: any) => {
        const affected =
          res?.rowCount ?? res?.affectedRows ?? (typeof res === "number" ? res : undefined) ?? res?.length;
      return affected === 0 ? err(new Error("Download token not found")) : ok<void>(undefined);
    })
    .catch((e) => err(e instanceof Error ? e : new Error(String(e))));
}

}

