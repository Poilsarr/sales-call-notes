/**
 * Resolve a request's API key (if any) to a user.
 *
 * Called from API route handlers OR middleware. Returns the ApiKey row
 * (with userId) on hit, null on miss. Does NOT enforce scope — the
 * caller checks scope against the request method.
 *
 * Performance: indexed on prefix (12-char prefix is highly selective
 * with random base64). Single round-trip per request.
 */
import prisma from "@/lib/prisma";
import { extractBearerKey, hashKey, prefixOf } from "@/lib/api-key";

export type ApiKeyContext = {
  userId: string;
  keyId: string;
  scope: string;
  prefix: string;
};

export async function resolveApiKey(
  authHeader: string | null | undefined,
): Promise<ApiKeyContext | null> {
  const raw = extractBearerKey(authHeader);
  if (!raw) return null;
  const prefix = prefixOf(raw);
  const row = await prisma.apiKey.findUnique({
    where: { prefix },
select: {
        id: true,
        userId: true,
        hash: true,
        scope: true,
        prefix: true,
        revokedAt: true,
      },
  });
  if (!row || row.revokedAt) return null;
  const expected = hashKey(raw);
  // Constant-time compare to avoid timing leaks.
  if (!timingSafeEqual(expected, row.hash)) return null;
  // Update lastUsedAt fire-and-forget — don't block the request.
  prisma.apiKey
    .update({ where: { id: row.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});
  return {
    userId: row.userId,
    keyId: row.id,
    scope: row.scope,
    prefix: row.prefix,
  };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}