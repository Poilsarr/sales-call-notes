/**
 * Resolve a user's BYOK keys (if any) to plaintext for the AI pipeline.
 *
 * Decryption failures (wrong master key, tampered rows) are logged and
 * skipped — the pipeline falls back to Gauge's shared keys rather than
 * failing the user's call.
 */

import prisma from "@/lib/prisma";
import { decryptSecret } from "@/lib/byok";

export interface ByokKeys {
  openaiKey?: string;
  groqKey?: string;
  /**
   * Providers whose stored key failed to decrypt (corrupt row, rotated
   * master key). The pipeline falls back to Gauge's shared pool for these,
   * and the API response carries a byokWarning so the client can surface it.
   */
  dropped?: string[];
}

export async function getByokKeys(userId: string): Promise<ByokKeys> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { byokOpenaiKey: true, byokGroqKey: true },
  });
  if (!user) return { dropped: [] };

  const result: ByokKeys = { dropped: [] };
  if (user.byokOpenaiKey) {
    try {
      result.openaiKey = decryptSecret(user.byokOpenaiKey);
    } catch (e) {
      result.dropped!.push("openai");
      console.error(`[byok] failed to decrypt OpenAI key for ${userId}:`, e);
    }
  }
  if (user.byokGroqKey) {
    try {
      result.groqKey = decryptSecret(user.byokGroqKey);
    } catch (e) {
      result.dropped!.push("groq");
      console.error(`[byok] failed to decrypt Groq key for ${userId}:`, e);
    }
  }
  return result;
}
